import { Context } from '@textile/context'
import { ThreadID, Client, PrivateKey, Identity } from '@textile/hub'

// @ts-ignore
import config from '@/config/config'

export default class Threads {
  private _identifier: string | null
  private _threadID: ThreadID | null
  private _token: string | null
  private _client: Client | null

  constructor () {
    this._identifier = null
    this._threadID = null
    this._token = null
    this._client = null
  }

  // Getters
  get identifier () {
    return this._identifier
  }

  get threadID () {
    return this._threadID
  }

  get client () {
    return this._client
  }

  get token () {
    return this._token
  }

  // Methods
  async init (identifier: string, client: Client, token: any) {
    this._identifier = identifier
    this._client = client
    this._token = token
  }

  async authorize (identity: Identity): Promise<null | any> {
    return new Promise(async resolve => {
      const client =
        config.env === 'dev'
          ? new Client(new Context(config.textile.localURI))
          : await Client.withKeyInfo({
              key: config.textile.key
            })

      const token = await client.getToken(identity).catch(e => {
        resolve(new Error("Couldn't connect to Textile.io"))
      })

      resolve({
        client,
        token
      })
    })
  }

  async getCreateThread () {
    if (!this._client || !this._identifier)
      return new Error(
        'Attempted to interface with a thread before initalizing'
      )
    const threadTag = 'textile.private.thread'
    this._threadID = await this._client.newDB(
      undefined,
      this._identifier + Date.now()
    )
    if (!localStorage.getItem(threadTag)) {
      this._threadID = await this._client.newDB(
        undefined,
        this._identifier + Date.now()
      )
      localStorage.setItem(threadTag, this._threadID.toString())
    } else {
      const localThreadID = localStorage.getItem(threadTag) || ''
      this._threadID = ThreadID.fromString(localThreadID)
    }
  }
}
