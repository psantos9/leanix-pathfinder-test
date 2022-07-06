
// https://github.com/node-fetch/node-fetch/discussions/1503
import fetch, { RequestInit } from 'node-fetch'
import createHttpsProxyAgent from 'https-proxy-agent'
import jwtDecode from 'jwt-decode'

export type LeanIXHost = string
export type LeanIXApiToken = string
export type BearerToken = string
export type LeanIXWorkspaceId = string
export type LeanIXWorkspaceName = string

export interface LeanIXCredentials {
  host: LeanIXHost
  apitoken: LeanIXApiToken
  proxyURL?: string
}

export interface AccessToken {
  accessToken: BearerToken
  expired: boolean
  expiresIn: number
  scope: string
  tokenType: string
}

export interface JwtClaims {
  exp: number
  instanceUrl: string
  iss: string
  jti: string
  sub: string
  principal: { permission: { workspaceId: LeanIXWorkspaceId, workspaceName: LeanIXWorkspaceName } }
}

const snakeToCamel = (s: string): string => s.replace(/([-_]\w)/g, g => g[1].toUpperCase())

export const getAccessToken = async (credentials: LeanIXCredentials): Promise<AccessToken> => {
  const uri = `https://${credentials.host}/services/mtm/v1/oauth2/token?grant_type=client_credentials`
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from('apitoken:' + credentials.apitoken).toString('base64')}`
  }
  const options: RequestInit = { method: 'post', headers }
  if (credentials.proxyURL) options.agent = createHttpsProxyAgent(credentials.proxyURL)
  const accessToken: AccessToken = await fetch(uri, options)
    .then(async res => {
      const content = await res[res.headers.get('content-type') === 'application/json' ? 'json' : 'text']()
      return res.ok ? content as AccessToken : await Promise.reject(res.status)
    })
    .then(accessToken => Object.entries(accessToken)
      .reduce((accumulator, [key, value]) => ({ ...accumulator, [snakeToCamel(key)]: value }), {
        accessToken: '',
        expired: false,
        expiresIn: 0,
        scope: '',
        tokenType: ''
      }))
  return accessToken
}

export const getAccessTokenClaims = (accessToken: AccessToken): JwtClaims => jwtDecode(accessToken.accessToken)

export const getLaunchUrl = (bearerToken: BearerToken): string => {
  const decodedToken: JwtClaims = jwtDecode(bearerToken)
  const baseLaunchUrl = `${decodedToken.instanceUrl}/${decodedToken.principal.permission.workspaceName}#access_token=${bearerToken}`
  return baseLaunchUrl
}
