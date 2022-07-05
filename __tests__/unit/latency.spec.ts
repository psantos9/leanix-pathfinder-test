import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { nanoid } from '../../lib/nanoid'
import { takeAzureLatencySnapshot } from '../../lib/latency'

const outputDir = join(process.cwd(), '.output')

describe('Azure Latency library', () => {
  beforeAll(() => {
    if (!existsSync(outputDir)) mkdirSync(outputDir)
  })

  test('allows to take a latency snapshot', async () => {
    const snapshot = await takeAzureLatencySnapshot({ sampleSize: 5 })
    expect(Array.isArray(snapshot)).toBe(true)
    snapshot
      .forEach(availabilityRegionProbe => {
        expect(availabilityRegionProbe)
          .toEqual(expect.objectContaining({
            availabilityZone: expect.any(String),
            mean: expect.any(Number),
            stdev: expect.any(Number),
            timestamp: expect.any(Number)
          }))
      })
    writeFileSync(join(outputDir, `latency_snapshot_${nanoid()}.json`), JSON.stringify(snapshot, null, 2))
  }, 240000)
})
