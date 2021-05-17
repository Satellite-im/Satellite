// @ts-ignore
import { Identity, PublicKey } from '@textile/hub'
import Bucket from './Bucket'
import BucketManager from './textile/BucketManager'
import Drawer from './Drawer'
// @ts-ignore
import config from '@/config/config'
// @ts-ignore
import { LocalStorage, ThreadDB } from './interpreters'
import { MessageManager } from './MessageManager'
import { SignalingManager } from '../webrtc/SignalingManager'
import ThreadManager from './textile/ThreadManager'
import IdentityManager from './textile/IdentityManager'
import { publicKeyToString, publicKeyBytesFromString } from '@textile/crypto'

import {
  Creds,
  StorageInterface,
  StorageInitializationData,
  TextileConfig,
  LocalStorageConfig,
  Extras
} from './Interfaces'
import { MailboxManager } from './textile/MailboxManager'

export default class Database {
  name: string
  prefix: string
  interface: any
  availableInterfaces: any[]
  creds: Creds | null
  threadManager: ThreadManager | null
  bucketManager: BucketManager | null
  messageManager: MessageManager | null
  signalingManager?: SignalingManager
  identityManager: IdentityManager
  threadDB: ThreadDB | null
  mailboxManager: MailboxManager | null

  /** @constructor
   * Construct a Database
   * Provides key-value and relational storage
   * @argument name the name of the database
   */
  constructor (name: string) {
    this.name = name
    this.prefix = 'vdb.'
    this.interface
    this.availableInterfaces = [ThreadDB, LocalStorage]
    this.identityManager = new IdentityManager()
    this.threadDB = null
    this.threadManager = null
    this.bucketManager = null
    this.messageManager = null
    this.mailboxManager = null
    this.creds = null
  }

  async init (
    storageInterface: StorageInterface,
    data: StorageInitializationData
  ) {
    if (storageInterface === 'textile') {
      const { id, pass, wallet }: TextileConfig = data

      if (!wallet) throw new Error('Wallet is mandatory for textile')

      const identity = await this.identityManager.fromWallet(wallet)
      const { client, users } = await this.identityManager.authorize(identity)

      this.creds = {
        id,
        pass
      }

      const textile: Extras = {
        identity,
        client,
        wallet,
        users
      }

      this.interface = new ThreadDB(this.prefix, this.creds, textile)
      this.threadManager = new ThreadManager('LocalStorage', client)
      this.messageManager = new MessageManager(client, id)
      this.signalingManager = new SignalingManager(client, id)
      this.bucketManager = new BucketManager(identity, this.creds.id)
      this.mailboxManager = new MailboxManager(
        this.prefix,
        textile,
        wallet.address
      )
      await this.mailboxManager.init()

      return
    }

    if (storageInterface === 'localStorage') {
      const { id, pass }: LocalStorageConfig = data
      this.creds = { id, pass }
      this.interface = new LocalStorage(this.prefix, this.creds)
      return
    }
  }

  /**
   * @method
   * Used to authenticate connections and encrypt data
   * @argument id identity
   * @argument pass password
   */
  async authenticate (
    intrface: string,
    id: string,
    pass: string,
    extras: Extras,
    identity?: Identity
  ) {
    this.creds = {
      id,
      pass
    }
    switch (intrface) {
      case 'localStorage':
        this.interface = new LocalStorage(this.prefix, this.creds)
        break
      case 'textile':
        this.interface = new ThreadDB(this.prefix, this.creds, extras)
        this.threadManager = new ThreadManager('LocalStorage', extras.client)
        this.messageManager = new MessageManager(extras.client, id)
        this.signalingManager = new SignalingManager(extras.client, id)
        if (identity) {
          this.bucketManager = new BucketManager(identity, this.creds.id)
        }
        break
      default:
        this.interface = new LocalStorage(this.prefix, this.creds)
        break
    }
  }

  async initBuckets () {
    if (!this.bucketManager) return
    await this.bucketManager.init({
      key: config.textile.key
    })
  }

  /**
   * @method
   * Construct a Drawer
   * A drawer stores data in a key-value structure
   * @argument name the name of the bucket
   */
  Drawer (name: string) {
    // TODO
    return new Drawer(name, this)
  }

  /**
   * @method
   * Construct a Bucket
   * A bucket stores data in a relational structure
   * @argument name the name of the bucket
   */
  Bucket (name: string) {
    return new Bucket(name, this)
  }
}
