import { test, expect } from '@playwright/test'
import { join } from 'path'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { getAccessToken, getAccessTokenClaims, getLaunchUrl } from '../../lib/leanix'

// !!! do not forget to add to the root project folder a ".env" file
// with LEANIX_HOST and LEANIX_APITOKEN variables
const {
  LEANIX_HOST: host = '',
  LEANIX_APITOKEN: apitoken = ''
} = process.env

const outputDir = join(process.cwd(), '.output')

let launchUrl: string | null = null

test.beforeAll(async () => {
  // create output dir if not exists
  if (!existsSync(outputDir)) mkdirSync(outputDir)
  // ensure that LEANIX_HOST and LEANIX_APITOKEN are defined in the '.env' file
  expect(host).not.toBeFalsy()
  expect(apitoken).not.toBeFalsy()
  const accessToken = await getAccessToken({ host, apitoken })
  const claims = getAccessTokenClaims(accessToken)
  writeFileSync(join(outputDir, 'token_claims.json'), JSON.stringify(claims, null, 2))
  launchUrl = getLaunchUrl(accessToken.accessToken)
  expect(launchUrl).not.toBeFalsy()
})

test.describe('LeanIX Pathfinder', () => {
  test('should perform an interactive signin cycle', async ({ page }) => {
    expect(launchUrl).not.toBe(null)
    expect(launchUrl).not.toBeFalsy()
    await page.goto(launchUrl as string)

    // check if we sucessfully signed in pathfinder app
    expect.soft(await page.locator('a.userName').innerText()).toBeTruthy()
  })
})
