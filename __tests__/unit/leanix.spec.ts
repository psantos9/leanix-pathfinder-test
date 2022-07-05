
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { getAccessToken, getLaunchUrl, getAccessTokenClaims, LeanIXCredentials } from '../../lib/leanix'

const { LEANIX_HOST: host = '', LEANIX_APITOKEN: apitoken = '' } = process.env
const credentials: LeanIXCredentials = { host, apitoken }
const outputDir = join(process.cwd(), '.output')

describe('LeanIX helpers', () => {
  beforeAll(() => {
    if (!existsSync(outputDir)) mkdirSync(outputDir)
  })
  test('allow to get an access token from credentials', async () => {
    expect(credentials.host).not.toBeFalsy()
    expect(credentials.apitoken).not.toBeFalsy()

    const accessToken = await getAccessToken(credentials)
    expect(accessToken)
      .toEqual(expect.objectContaining({
        accessToken: expect.any(String),
        expired: expect.any(Boolean),
        expiresIn: expect.any(Number),
        scope: expect.any(String),
        tokenType: 'bearer'
      })
      )
  })
  test('allow to login into a workspace using an access token', async () => {
    const accessToken = await getAccessToken(credentials)
    const claims = getAccessTokenClaims(accessToken)
    const launchUrl = getLaunchUrl(accessToken.accessToken)
    const url = new URL(launchUrl)
    expect(url.origin).toEqual(claims.instanceUrl)
    expect(url.pathname).toEqual(`/${claims.principal.permission.workspaceName}`)
    expect(url.hash).toContain('#access_token=')
  })
})
