import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/unit/*.spec.ts'],
  setupFiles: ['dotenv/config']
}

export default config
