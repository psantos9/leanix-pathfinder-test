import { test, expect } from '@playwright/test'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getAccessToken, getLaunchUrl } from '../../lib/leanix'
import { takeAzureLatencySnapshot } from '../../lib/azure-latency'
import { nanoid } from '../../lib/nanoid'

// !!! do not forget to add to the root project folder a ".env" file
// with LEANIX_HOST and LEANIX_APITOKEN variables
const {
  LEANIX_HOST: host = '',
  LEANIX_APITOKEN: apitoken = ''
} = process.env

const outputDir = join(process.cwd(), '.output')

let launchUrl: string | null = null

test.describe.configure({ mode: 'parallel' })

test.beforeAll(async () => {
  // create output dir if not exists
  if (!existsSync(outputDir)) mkdirSync(outputDir)
  // ensure that LEANIX_HOST and LEANIX_APITOKEN are defined in the '.env' file
  expect(host).not.toBeFalsy()
  expect(apitoken).not.toBeFalsy()
  launchUrl = getLaunchUrl((await getAccessToken({ host, apitoken })).accessToken)
  expect(launchUrl).not.toBeFalsy()
})

test.afterAll(async () => {
  // produce statistics and create zip file
  // const snapshot = await takeAzureLatencySnapshot({ sampleSize: 5 })
  // if (!existsSync(outputDir)) mkdirSync(outputDir)
  // writeFileSync(join(outputDir, 'snapshot.json'), JSON.stringify(snapshot, null, 2))
})

test.describe('LeanIX Pathfinder', () => {
  test('should perform an interactive signin cycle', async ({ page }) => {
    expect(launchUrl).not.toBe(null)
    expect(launchUrl).not.toBeFalsy()
    await page.goto(launchUrl as string)

    // check if we sucessfully signed in pathfinder app
    expect(await page.locator('a.userName').innerText()).toBeTruthy()

    // signout procedure (skipped...)
    // await page.locator('button#menuLink').click()
    // await page.locator('lx-option.logoutLink').click()
    // when signing out, LeanIX Pathfinder can point the user
    // to two different pages, the sign in form page or the
    // 'You have been logged out.' page. We'll wait one of
    // these two to be rendered
    /*
    await Promise.race([
      page.locator('div.text', { hasText: 'You have been logged out.' }).innerText(),
      page.locator('header.App-header>h1', { hasText: 'Login to LeanIX' }).innerText()
    ])
    */
  })
  test('should take a snapshot of latency times for azure regions', async () => {
    const snapshot = await takeAzureLatencySnapshot({ sampleSize: 5 })
    writeFileSync(join(outputDir, `snapshot_${nanoid()}.json`), JSON.stringify(snapshot, null, 2))
  })
})
