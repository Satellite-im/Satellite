import { Identity } from '@textile/hub'
import { Client } from '@textile/hub-threads-client'
import { Users } from '@textile/users'
import { Wallet } from 'ethers'

export interface AuthData {
  client: Client
  users: Users
  token: string
}

export interface StorageConfig {
  id: string
  pass: string
}

export interface TextileConfig extends StorageConfig {
  wallet?: Wallet
}

export interface LocalStorageConfig extends StorageConfig {}

export type StorageInterface = 'localStorage' | 'textile'
export type StorageInitializationData = TextileConfig | LocalStorageConfig

export interface Interface {
  _retrieve: CallableFunction
  _update: CallableFunction
  _store: CallableFunction
  _key: CallableFunction
}

export interface Creds {
  id: string
  pass: string
}

export interface Extras {
  identity: Identity
  client: Client
  users: Users
  wallet: Wallet
}

export type MailboxFolder = 'inbox' | 'sentbox'
