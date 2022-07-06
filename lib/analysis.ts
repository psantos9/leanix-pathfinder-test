import { readdirSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'
import { mean, std } from 'mathjs'
import AdmZip from 'adm-zip'
import { parse } from 'json2csv'
import { HAR } from './types'
import { AzureLatencySnapshot } from './latency'
import { JwtClaims } from './leanix'

export interface TestSummary {
  timestamp: string
  instanceUrl: string
  workspaceId: string
  workspaceName: string
  attempts: number
  timeouts: number
  timeoutHARs: string[]
  /*
  *  The DOMContentLoaded event is fired when the document has been completely loaded and parsed, without waiting
  *  for stylesheets, images, and subframes to finish loading (the load event can be used to detect a fully-loaded
  *  page).
  */
  onContentLoadStats: { mean: number, std: number, samples: number[] }
  onLoadStats: { mean: number, std: number, samples: number[] }
  latencySnapshot: AzureLatencySnapshot[]
}

export const processTestFiles = (outputDir: string): TestSummary => {
  let instanceUrl = ''
  let workspaceName = ''
  let workspaceId = ''
  const allowedFileExtensions = ['har', 'json']
  const files = readdirSync(outputDir)
  const harIndex: Record<string, HAR> = {}
  const snapshot: AzureLatencySnapshot[] = []
  files
    .forEach(file => {
      const [filename, extension] = file.split('.')
      if (!allowedFileExtensions.includes(extension)) return
      const contents = JSON.parse(readFileSync(join(outputDir, file)).toString())
      if (extension === 'har' && contents.log) harIndex[file] = contents
      else if (filename.startsWith('latency_snapshot') && extension === 'json') snapshot.push(...contents)
      else if (filename.startsWith('token_claims') && extension === 'json') {
        const claims = contents as JwtClaims
        instanceUrl = claims.instanceUrl;
        ({ workspaceId, workspaceName } = claims.principal.permission)
      }
    })

  const loadingTimes = Object.entries(harIndex)
    .map(([filename, har]) => {
      const { pageTimings: { onContentLoad, onLoad }, startedDateTime } = har.log.pages[0]
      return { filename, startedDateTime, onContentLoad, onLoad }
    })
    .sort(({ onLoad: A }, { onLoad: B }) => A > B ? 1 : A < B ? -1 : 0)
  const validLoadingTimes = loadingTimes.filter(({ onLoad }) => onLoad > -1)
  const { onContentLoad, onLoad } = validLoadingTimes
    .reduce((accumulator, { onContentLoad, onLoad }) => {
      accumulator.onContentLoad.push(onContentLoad)
      accumulator.onLoad.push(onLoad)
      return accumulator
    }, { onContentLoad: [], onLoad: [] })
  const timeoutHARs = loadingTimes.filter(({ onLoad }) => onLoad === -1).map(({ filename }) => filename)
  const summary: TestSummary = {
    timestamp: new Date().toISOString(),
    instanceUrl,
    workspaceId,
    workspaceName,
    attempts: loadingTimes.length,
    timeouts: timeoutHARs.length,
    timeoutHARs,
    onContentLoadStats: {
      mean: Math.round(mean(onContentLoad)),
      // @ts-ignore
      std: Math.round(std(onContentLoad)),
      samples: onContentLoad
    },
    onLoadStats: {
      mean: Math.round(mean(onLoad)),
      // @ts-ignore
      std: Math.round(std(onLoad)),
      samples: onLoad
    },
    latencySnapshot: snapshot
  }
  const zip = new AdmZip()
  zip.addFile('summary.json', Buffer.from(JSON.stringify(summary, null, 2), 'utf8'))
  files
    .filter(file => file.split('.')[1] === 'har')
    .forEach(file => zip.addLocalFile(join(outputDir, file)))
  zip.writeZip(join(outputDir, 'test_result.zip'))
  files.forEach(file => rmSync(join(outputDir, file)))
  return summary
}

export interface EntryStats {
  key: string
  url: string
  method: string
  serverIPAddress: string
  time: number[]
  meanTime: number
  stdTime: Number
}

export interface RequestRankEntry {
  url: string
  meanTime: number
  stdTime: number
  meanTimeAsPercentage: string
}

export interface ProcessedDataset {
  onContentLoad: number
  onLoad: number
  requestRank: RequestRankEntry[]
}
export const processDataset = (outputDir: string) => {
  const allowedFileExtensions = ['har', 'json']
  const harIndex: Record<string, HAR> = {}
  const files = readdirSync(outputDir)
  files
    .forEach(file => {
      const [, extension] = file.split('.')
      if (!allowedFileExtensions.includes(extension)) return
      const contents = JSON.parse(readFileSync(join(outputDir, file)).toString())
      if (extension === 'har' && contents.log) harIndex[file] = contents
    })

  const results = {
    onContentLoad: [] as number[],
    onLoad: [] as number[],
    entryIndex: {} as Record<string, EntryStats>
  }

  Object.values(harIndex)
    .forEach(har => {
      const { onContentLoad, onLoad } = har.log.pages[0].pageTimings
      results.onContentLoad.push(onContentLoad)
      results.onLoad.push(onLoad)
      har.log.entries
        .forEach(entry => {
          const url = new URL(entry.request.url)
          const queryString = parseInt(url.searchParams.toString())
          if (!isNaN(queryString)) entry.request.url = entry.request.url.split('?')[0]
          const entryKey = `${entry.request.url}_${entry.request.method}`
          if (!results.entryIndex[entryKey]) {
            results.entryIndex[entryKey] = {
              key: entryKey,
              url: entry.request.url,
              method: entry.request.method,
              serverIPAddress: entry.serverIPAddress,
              time: [],
              meanTime: -1,
              stdTime: -1
            }
          }
          results.entryIndex[entryKey].time.push(entry.time)
        })
    })
  const meanOnContentLoad = Math.round(mean(results.onContentLoad))
  const meanOnLoad = Math.round(mean(results.onLoad))
  const entryRank = Object.values(results.entryIndex)
    .map(entry => {
      const url = entry.url
      const meanTime = Math.round(mean(entry.time))
      // @ts-ignore
      const stdTime = Math.round(std(entry.time))
      const meanTimeAsPercentage = (meanTime * 100 / meanOnLoad).toFixed(2) + '%'
      return {
        url,
        meanTime,
        stdTime,
        meanTimeAsPercentage
      }
    })
    .sort(({ meanTime: A }, { meanTime: B }) => A > B ? -1 : A < B ? 1 : 0)
  const result = {
    onContentLoad: meanOnContentLoad,
    onLoad: meanOnLoad,
    requestRank: entryRank
  }
  return result
}

export const profileToCSV = (filePath: string) => {
  const contents = JSON.parse(readFileSync(filePath).toString())
  if (Array.isArray(contents.requestRank)) {
    const requestRank: RequestRankEntry[] = contents.requestRank
    const fields: Array<keyof RequestRankEntry> = ['url', 'meanTime', 'stdTime']
    const csv = parse(requestRank, { fields })
    return csv
  }
}
