import { join } from 'path'
import { existsSync, writeFileSync } from 'fs'
import { processTestFiles, processDataset, profileToCSV } from '../../lib/analysis'

const outputDir = join(process.cwd(), '.output')
const datasetDir = join(process.cwd(), '.dataset')

describe('The analysis library', () => {
  test('ingests test output files and generates statistics', async () => {
    await processTestFiles(outputDir)
  }, 240000)
  test('ingests test output files and generates page loading statistics', async () => {
    if (!existsSync(datasetDir)) return
    const result = processDataset(datasetDir)
    writeFileSync('profile.json', JSON.stringify(result, null, 2))
  })
  test('converts page loading statistics from json into csv', async () => {
    const filePath = join(datasetDir, 'eu-6_leanix_net.profile.json')
    if (!existsSync(filePath)) return
    const csv = profileToCSV(filePath)
    writeFileSync('profile.csv', csv)
  })
})
