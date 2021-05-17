import { ThreadID } from '@textile/hub'
import crypto from '../../../utils/Crypto'
import { Creds, Extras } from '../Interfaces'
interface Data {
  data: object
}

export class ThreadDB {
  threadID: any
  collectionSchema: { data: string; _id: string }
  prefix: string
  textile: Extras
  creds: Creds

  constructor (prefix: string, creds: Creds, textile: Extras) {
    this.prefix = prefix
    this.creds = creds
    this.textile = textile
    this.threadID = ThreadID

    this.collectionSchema = {
      data: 'encrypted-data',
      _id: '0'
    }
  }

  async checkDeps (name: string) {
    await this.ensureThreadID()
    await this.ensureCollection(name)
  }

  buildObject (data: string) {
    return [
      {
        data,
        _id: Date.now().toString()
      }
    ]
  }

  async ensureThreadID () {
    const threadTag = 'textile.threads.user-storage'
    if (!localStorage.getItem(threadTag)) {
      this.threadID = await this.textile.client.newDB(
        undefined,
        this.creds.id + Date.now()
      )
      localStorage.setItem(threadTag, this.threadID.toString())
    } else {
      const localThreadID = localStorage.getItem(threadTag) || ''
      this.threadID = ThreadID.fromString(localThreadID)
    }
  }

  async ensureCollection (name: string) {
    await this.textile.client
      .getCollectionIndexes(this.threadID, name)
      .catch(async () => {
        await this.textile.client.newCollectionFromObject(
          this.threadID,
          this.collectionSchema,
          {
            name
          }
        )
      })
  }

  async _store (value: any, name: string): Promise<void> {
    return new Promise(async resolve => {
      await this.checkDeps(name)
      const values = await this._retrive(name)
      values.push(value)

      const encrypted = await crypto.encrypt(
        JSON.stringify(values),
        this.creds.pass
      )

      this.textile.client.create(
        this.threadID,
        name,
        this.buildObject(encrypted)
      )
      resolve()
    })
  }

  async _update (bucket: any, name: string): Promise<void> {
    return new Promise(async resolve => {
      await this.checkDeps(name)

      const encrypted = await crypto.encrypt(
        JSON.stringify(bucket),
        this.creds.pass
      )

      this.textile.client.create(
        this.threadID,
        name,
        this.buildObject(encrypted)
      )
      resolve()
    })
  }

  async getDataOrEmpty (name: string): Promise<Data[]> {
    return new Promise(async resolve => {
      let data =
        (await this.textile.client.find(this.threadID, name, {}).catch(err => {
          // Collection not found
          resolve([])
        })) || []
      resolve(<Array<Data>>data)
    })
  }

  async _retrive (name: string): Promise<any[]> {
    return new Promise(async resolve => {
      await this.checkDeps(name)
      let data = await this.getDataOrEmpty(name)
      if (data.length) {
        const decryptedData: string | null = await crypto.decrypt(
          data[data.length - 1].data.toString(),
          this.creds.pass
        )
        const parsedData = decryptedData ? JSON.parse(decryptedData) : []
        resolve(parsedData)
      } else {
        resolve([])
      }
    })
  }

  _key (name: string) {
    return `${this.prefix}${name}`
  }
}
