import { join } from 'path'
import { processTestFiles } from '../../lib/analysis'

const outputDir = join(process.cwd(), '.output')

describe('The analysis library', () => {
  test('ingests test output files and generates statistics', async () => {
    await processTestFiles(outputDir)
  }, 240000)
})
