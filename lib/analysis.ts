import { readdirSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'
import { mean, std } from 'mathjs'
import AdmZip from 'adm-zip'
import { HAR } from './types'
import { AzureLatencySnapshot } from './latency'
import { nanoid } from './nanoid'
import { JwtClaims } from './leanix'

export interface TestSummary {
  timestamp: string
  instanceUrl: string
  workspaceId: string
  workspaceName: string
  attempts: number
  timeouts: number
  timeoutHARs: string[]
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
    onLoadStats: {
      mean: Math.round(mean(onLoad)),
      // @ts-ignore
      std: Math.round(std(onLoad)),
      samples: onLoad
    },
    onContentLoadStats: {
      mean: Math.round(mean(onContentLoad)),
      // @ts-ignore
      std: Math.round(std(onContentLoad)),
      samples: onContentLoad
    },
    latencySnapshot: snapshot
  }
  const zip = new AdmZip()
  zip.addFile('summary.json', Buffer.from(JSON.stringify(summary, null, 2), 'utf8'))
  files
    .filter(file => file.split('.')[1] === 'har')
    .forEach(file => zip.addLocalFile(join(outputDir, file)))
  zip.writeZip(join(outputDir, `test_result_${nanoid()}.zip`))
  files.forEach(file => rmSync(join(outputDir, file)))
  return summary
}
