export interface Timings {
  connect: number
  dns: number
  receive: number
  send: number
  ssl: number
  wait: number
}

export interface SecurityDetails {
  issuer: string
  protocol: string
  subjectName: string
  validFrom: number
  validTo: number
}

export interface Request {
  method: string
  url: string
  queryString: unknown
  httpVersion: string
  bodySize: number
  cookies: unknown
  headers: Array<{ name: string, value: string }>
}

export interface Response {
  _transferSize: number
  bodySize: number
  content: { compression: number, mimeType: string, size: number }
  cookies: unknown
  headers: Array<{ name: string, value: string }>
  headersSize: number
  httpVersion: string
  redirectUrl: string
  status: number
  statusText: string
}

export interface Entry {
  startedDateTime: string
  time: number
  timings: Timings
  pageref: string
  cache: any
  serverIPAddress: string
  _serverPort: number
  _securityDetails: SecurityDetails
  request: Request
  response: Response
}

export interface Page {
  id: 'string'
  pageTimings: { onContentLoad: number, onLoad: number }
  startedDateTime: string
  title: string
}

export interface HAR {
  log: {
    browser: { name: string, version: string }
    creator: { name: string, version: string }
    entries: Entry[]
    pages: Page[]
  }
}
