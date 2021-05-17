import { Client, ThreadID } from '@textile/hub'
import Crypto from '../crypto/Crypto'
import Message from '../Message'
import Signal from '../Signal'

import { utils, Wallet } from 'ethers'
import { SigningKey } from 'ethers/lib/utils'

interface IMessage {
  _id: string
  sender: string
  to: ''
  at: number
  type: string
  payload: any
  encrypted: boolean
  secure: boolean
  metadata: object
}

const messageSchema = <IMessage>{
  _id: '',
  sender: '',
  to: '',
  at: Date.now(),
  type: '',
  payload: {},
  encrypted: false,
  secure: false,
  metadata: {}
}

interface ISignal {
  _id: string
  sender: string
  at: number
  type: string
  payload: any
}

const signalSchema = <ISignal>{
  _id: '',
  sender: '',
  to: '',
  at: Date.now(),
  type: '',
  payload: {}
}

export class MessageManager {
  client: Client
  crypto: Crypto
  key: CryptoKeyPair | null
  address: string
  signingKey: SigningKey | null
  activeSubscriptions: { [key: string]: any }

  constructor (client: Client, address: string) {
    this.client = client
    this.address = address
    this.crypto = new Crypto()
    this.key = null
    this.signingKey = null
    this.activeSubscriptions = {}
  }

  /**
   * @function initE2EEngine
   * @param wallet Ethers js wallet
   */
  initE2EEngine (wallet: Wallet) {
    this.signingKey = new utils.SigningKey(wallet.privateKey)

    this.crypto.init(wallet)
  }

  safeThread (threadID: ThreadID | string): ThreadID {
    return typeof threadID === 'string'
      ? ThreadID.fromString(threadID.replace(/\W/g, ''))
      : threadID
  }

  buildMessage (to: string, at: number, type: string, data: any) {
    const message = new Message(to, this.address, at, type, data)
    return {
      _id: '',
      id: message.id,
      sender: this.address,
      to: message.to,
      at: at,
      type: type,
      payload: message.payload,
      encrypted: Boolean(this.signingKey),
      secure: false,
      metadata: {}
    }
  }

  buildSignal (data: any, initiator: boolean) {
    const signal = new Signal(
      this.address,
      new Date().getTime(),
      'signal',
      data,
      initiator
    )

    return {
      _id: signal._id,
      sender: signal.sender,
      at: signal.at,
      type: signal.type,
      payload: signal.payload
    }
  }

  async ensureCollection (
    threadID: ThreadID,
    collectionName: string,
    schema: any
  ) {
    try {
      await this.client.getCollectionIndexes(threadID, collectionName)
    } catch (e) {
      await this.client.newCollectionFromObject(threadID, schema, {
        name: collectionName
      })
    }
  }

  async addMessageDeterministically (
    threadID: ThreadID,
    message: Message,
    recipient: string
  ) {
    if (this.signingKey) {
      this.addEncryptedMessage(threadID, message, recipient)
    } else {
      this.addNewMessage(threadID, message)
    }
  }

  async addNewMessage (
    threadID: ThreadID,
    message: Message
  ): Promise<ThreadID> {
    await this.ensureCollection(threadID, 'messages', messageSchema)
    await this.client.create(threadID, 'messages', [message])
    return threadID
  }

  async addEncryptedMessage (
    threadID: ThreadID,
    message: Message,
    guestPublicKey: string
  ): Promise<ThreadID | null> {
    if (!this.signingKey) {
      return null
    }
    await this.ensureCollection(threadID, 'messages', messageSchema)

    const aesKey = await this.crypto.initializeRecipient(
      message.to,
      guestPublicKey
    )

    const encryptedPayload = await this.crypto.encrypt(
      JSON.stringify(message.payload),
      aesKey
    )

    const encryptedMessage = Object.assign({}, message, {
      encrypted: true,
      secure: true,
      payload: {
        encryptedData: encryptedPayload
      }
    })

    await this.client.create(threadID, 'messages', [encryptedMessage])
    return threadID
  }

  async decryptMessage (message: IMessage, guestPublicKey: string) {
    if (!message.encrypted || !this.signingKey) return message

    const aesKey = await this.crypto.initializeRecipient(
      message.to,
      guestPublicKey
    )

    try {
      const decrpytedPayload = await this.crypto.decrypt(
        message.payload.encryptedData,
        aesKey
      )

      return {
        ...message,
        encrypted: false,
        secure: true,
        payload: JSON.parse(decrpytedPayload)
      }
    } catch (e) {
      return message
    }
  }

  async bulkDecrypt (messages: IMessage[], guestPublicKey: string) {
    const decryptedMessages: Promise<IMessage>[] = []
    messages.map(msg =>
      decryptedMessages.push(this.decryptMessage(msg, guestPublicKey))
    )
    const resolvedMessages = await Promise.all(decryptedMessages)
    return resolvedMessages
  }

  async getMessages (threadID: ThreadID | string): Promise<Message[]> {
    return new Promise(async resolve => {
      const safeThread = this.safeThread(threadID)

      let messages =
        (await this.client.find(safeThread, 'messages', {}).catch(err => {
          // Collection not found
          resolve([])
        })) || []

      resolve(<Array<Message>>messages)
    })
  }

  subscribe (
    threadID: ThreadID,
    callback: CallableFunction,
    onUnsubscribe: CallableFunction
  ) {
    if (this.isSubscribed(threadID)) {
      console.warn(
        `Already subscribed to thread ${threadID.toString()}. Skipping.`
      )

      return
    }

    const cb = (update: any, err: any) => {
      // Trigger the onUnsubscribe
      if (!update?.instance) {
        this.unsubscribe(threadID)
        onUnsubscribe(threadID)
        return
      }

      callback(update)
    }

    const filters = [
      {
        collectionName: 'messages',
        actionTypes: ['CREATE']
      }
    ]

    const listener = this.client.listen(threadID, filters, cb)

    // Track listener
    this.activeSubscriptions[threadID.toString()] = listener

    return listener
  }

  unsubscribe (threadID: ThreadID) {
    if (!this.isSubscribed(threadID)) {
      console.warn(
        `There are no subscription to ${threadID.toString()}. Skipping.`
      )

      return
    }

    const subscription = this.activeSubscriptions[threadID.toString()]

    if (typeof subscription.close === 'function') {
      try {
        subscription.close()
      } catch (e) {}

      delete this.activeSubscriptions[threadID.toString()]
    }
  }

  isSubscribed (threadID: ThreadID) {
    return threadID
      ? Boolean(this.activeSubscriptions[threadID.toString()])
      : false
  }
}
