// ref: https://www.azurespeed.com/Azure/Latency
import Bottleneck from 'bottleneck'
import fetch from 'node-fetch'
import { std } from 'mathjs'

export enum AzureRegion {
  ASIA_PACIFIC = 'Asia Pacific',
  SOUTH_AMERICA = 'South America',
  CANADA = 'Canada',
  US = 'US',
  EUROPE = 'Europe',
  AFRICA = 'Africa',
  MIDDLE_EAST = 'Middle East'
}

export enum AzureAvailabilityZone {
  AUSTRALIA_CENTRAL = 'a1australiacentral',
  AUSTRALIA_EAST = 'a1australiaeast',
  AUSTRALIA_SOUTH_EAST = 'a1australiasoutheast',
  CENTRAL_INDIA = 'a1centralindia',
  EAST_ASIA = 'a1eastasia',
  JAPAN_EAST = 'a1japaneast',
  JAPAN_WEST = 'a1japanwest',
  KOREA_CENTRAL = 'a1koreacentral',
  KOREA_SOUTH = 'a1koreasouth',
  SOUTHEAST_ASIA = 'a1southeastasia',
  SOUTH_INDIA = 'a1southindia',
  WEST_INDIA = 'a1westindia',
  BRAZIL_SOUTH = 'a1brazilsouth',
  BRAZIL_SOUTHEAST = 'a1brazilsoutheast',
  CANADA_CENTRAL = 'a1canadacentral',
  CANADA_EAST = 'a1canadaeast',
  CENTRAL_US = 'a1centralus',
  EAST_US = 'a1eastus',
  EAST_US_2 = 'a1eastus2',
  NORTH_CENTRAL_US = 'a1northcentralus',
  SOUTH_CENTRAL_US = 'a1southcentralus',
  WEST_CENTRAL_US = 'a1westcentralus',
  WEST_US = 'a1westus',
  WEST_US_2 = 'a1westus2',
  WEST_US_3 = 'a1westus3',
  FRANCE_CENTRAL = 'a1francecentral',
  GERMANY_WEST_CENTRAL = 'a1germanywestcentral',
  NORTH_EUROPE = 'a1northeurope',
  NORWAY_EAST = 'a1norwayeast',
  SWEDEN_CENTRAL = 'a1swedencentral',
  SWITZERLAND_NORTH = 'a1switzerlandnorth',
  UK_SOUTH = 'a1uksouth',
  UK_WEST = 'a1ukwest',
  WEST_EUROPE = 'a1westeurope',
  SOUTH_AFRICA_NORTH = 'a1southafricanorth',
  UAE_NORTH = 'a1uaenorth'
}

export type AzureAvailabilityZoneIndex = Record<AzureAvailabilityZone, { label: string, region: AzureRegion }>

export interface AzureLatencyMeasurements {
  availabilityZone: AzureAvailabilityZone
  timestamp: number
  sampleSize: number
  mean: number
  stdev: number
  samples: number[]
}

export interface AzureLatencySnapshot {
  availabilityZone: AzureAvailabilityZone
  timestamp: number
  mean: number
  stdev: number
}

export const azureAvailabilityZoneIndex: AzureAvailabilityZoneIndex = {
  [AzureAvailabilityZone.AUSTRALIA_CENTRAL]: { label: 'Australia Central', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.AUSTRALIA_EAST]: { label: 'Australia East', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.AUSTRALIA_SOUTH_EAST]: { label: 'Australia Southeast', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.CENTRAL_INDIA]: { label: 'Central India', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.EAST_ASIA]: { label: 'East Asia', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.JAPAN_EAST]: { label: 'Japan East', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.JAPAN_WEST]: { label: 'Japan West', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.KOREA_CENTRAL]: { label: 'Korea Central', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.KOREA_SOUTH]: { label: 'Korea South', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.SOUTHEAST_ASIA]: { label: 'Southeast Asia', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.SOUTH_INDIA]: { label: 'South India', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.WEST_INDIA]: { label: 'West India', region: AzureRegion.ASIA_PACIFIC },
  [AzureAvailabilityZone.BRAZIL_SOUTH]: { label: 'Brazil South', region: AzureRegion.SOUTH_AMERICA },
  [AzureAvailabilityZone.BRAZIL_SOUTHEAST]: { label: 'Brazil Southeast', region: AzureRegion.SOUTH_AMERICA },
  [AzureAvailabilityZone.CANADA_CENTRAL]: { label: 'Canada Central', region: AzureRegion.CANADA },
  [AzureAvailabilityZone.CANADA_EAST]: { label: 'Canada East', region: AzureRegion.CANADA },
  [AzureAvailabilityZone.CENTRAL_US]: { label: 'Central US', region: AzureRegion.US },
  [AzureAvailabilityZone.EAST_US]: { label: 'East US', region: AzureRegion.US },
  [AzureAvailabilityZone.EAST_US_2]: { label: 'East US 2', region: AzureRegion.US },
  [AzureAvailabilityZone.NORTH_CENTRAL_US]: { label: 'North Central US', region: AzureRegion.US },
  [AzureAvailabilityZone.SOUTH_CENTRAL_US]: { label: 'South Central US', region: AzureRegion.US },
  [AzureAvailabilityZone.WEST_CENTRAL_US]: { label: 'West Central US', region: AzureRegion.US },
  [AzureAvailabilityZone.WEST_US]: { label: 'West US', region: AzureRegion.US },
  [AzureAvailabilityZone.WEST_US_2]: { label: 'West US 2', region: AzureRegion.US },
  [AzureAvailabilityZone.WEST_US_3]: { label: 'West US 3', region: AzureRegion.US },
  [AzureAvailabilityZone.FRANCE_CENTRAL]: { label: 'France Central', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.GERMANY_WEST_CENTRAL]: { label: 'Germany West Central', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.NORTH_EUROPE]: { label: 'North Europe', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.NORWAY_EAST]: { label: 'Norway East', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.SWEDEN_CENTRAL]: { label: 'Sweden Central', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.SWITZERLAND_NORTH]: { label: 'Switzerland North', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.UK_SOUTH]: { label: 'UK South', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.UK_WEST]: { label: 'UK West', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.WEST_EUROPE]: { label: 'West Europe', region: AzureRegion.EUROPE },
  [AzureAvailabilityZone.SOUTH_AFRICA_NORTH]: { label: 'South Africa North', region: AzureRegion.AFRICA },
  [AzureAvailabilityZone.UAE_NORTH]: { label: 'UAE North', region: AzureRegion.MIDDLE_EAST }
}

const getBlobUrl = (availabilityZone: AzureAvailabilityZone) => `https://${availabilityZone}.blob.core.windows.net/public/latency-test.json`

const measureRequestLatency = (availabilityZone: AzureAvailabilityZone) => {
  const t0 = performance.now()
  return fetch(getBlobUrl(availabilityZone))
    .then(async res => {
      if (res.ok && res.status) {
        const latency = performance.now() - t0
        return { availabilityZone, latency, error: false, status: res.status }
      } else {
        return { availabilityZone, latency: -1, error: true, status: res.status }
      }
    })
}

export interface AzureLatencySnapshotParams {
  sampleSize?: number
}
export const takeAzureLatencySnapshot = async (params: AzureLatencySnapshotParams) => {
  const { sampleSize = 5 } = params
  const limiter = new Bottleneck({ maxConcurrent: 10 })
  limiter.on('failed', async (error, jobInfo) => {
    const id = jobInfo.options.id
    console.warn(`Job ${id} failed: ${error}`)
    if (jobInfo.retryCount === 0) { // Here we only retry once
      console.log(`Retrying job ${id} in 25ms!`)
      return 25
    }
  })
  const timestamp = new Date().getTime()
  const probeSamples = await Promise.all(Object.keys(azureAvailabilityZoneIndex)
    .map((availabilityZone: AzureAvailabilityZone) => [...Array(sampleSize).keys()]
      .map(() => limiter.schedule(async () => measureRequestLatency(availabilityZone)))
    ).flat()
  )
  const statistics = probeSamples
    .reduce((accumulator, sample) => {
      if (!accumulator[sample.availabilityZone]) {
        accumulator[sample.availabilityZone] = {
          availabilityZone: sample.availabilityZone,
          timestamp,
          sampleSize,
          mean: -1,
          stdev: -1,
          samples: []
        }
      }
      accumulator[sample.availabilityZone].samples.push(sample.latency)
      return accumulator
    }, {} as Record<AzureAvailabilityZone, AzureLatencyMeasurements>)
  const snapshot: AzureLatencySnapshot[] = Object.values(statistics)
    .map(({ samples, availabilityZone, timestamp }) => ({
      availabilityZone,
      timestamp,
      mean: Math.round(samples.reduce((a, b) => a + b) / samples.length),
      // @ts-ignore
      stdev: Math.round(std(samples))
    }))
    .sort(({ mean: A }, { mean: B }) => A > B ? 1 : A < B ? -1 : 0)
  return snapshot
}
