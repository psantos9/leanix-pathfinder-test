import { test, expect } from '@playwright/test'
import { getAccessToken, getLaunchUrl } from '../../lib/leanix'

// !!! do not forget to add to the root project folder a ".env" file
// with LEANIX_HOST and LEANIX_APITOKEN variables
const {
  LEANIX_HOST: host = '',
  LEANIX_APITOKEN: apitoken = ''
} = process.env

let launchUrl: string | null = null

test.beforeAll(async () => {
  const accessToken = await getAccessToken({ host, apitoken })
  launchUrl = getLaunchUrl(accessToken.accessToken)
  // context = await browser.newContext({ recordHar: { path: 'leanix.har', content: 'omit' } })
})

test.afterAll(() => {
})

test.describe('LeanIX Pathfinder', () => {
  test('should perform an interactive signin/signout cycle', async ({ page }) => {
    expect(launchUrl).not.toBe(null)
    expect(launchUrl).not.toBeFalsy()
    await page.goto(launchUrl as string)

    // check if we sucessfully signed in pathfinder app
    expect(await page.locator('a.userName').innerText()).toBeTruthy()

    // signout procedure
    await page.locator('button#menuLink').click()
    await page.locator('lx-option.logoutLink').click()
    // when signing out, LeanIX Pathfinder can point the user
    // to two different pages, the sign in form page or the
    // 'You have been logged out.' page. We'll wait one of
    // these two to be rendered
    await Promise.race([
      page.locator('div.text', { hasText: 'You have been logged out.' }).innerText(),
      page.locator('header.App-header>h1', { hasText: 'Login to LeanIX' }).innerText()
    ])
  })
})
