import { takeAzureLatencySnapshot } from '../../lib/azure-latency'

describe('Azure Latency library', () => {
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
  }, 30000)
})
