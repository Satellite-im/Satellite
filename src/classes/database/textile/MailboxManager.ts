import {
  PublicKey,
  PrivateKey,
  Identity,
  MailboxEvent,
  ThreadID,
  UserMessage
} from '@textile/hub'
import { Query } from '@textile/threads-client'
import { InboxListOptions, SentboxListOptions, Users } from '@textile/users'
import { Extras } from '../Interfaces'

interface IMessage extends UserMessage {
  sender: string
  to: ''
  at: number
  type: string
  payload: any
  encrypted: boolean
  secure: boolean
  metadata: object
}

/**
 * A simple type to hold inbox messages after they have been
 * decrypted with the PrivateKey
 */
interface DecryptedMessage {
  id: string
  body: string
  from: string
  sent: number
  readAt?: number
}

// The user message when is read using thread db client
interface MessageFromThread {
  _id: string
  created_at: number
  read_at?: number
  from: string
  body: string
  signature: string
  to: string
  _mod: number
}

type MailboxCallback = (
  reply?: MailboxEvent | undefined,
  err?: Error | undefined
) => void

type MailboxSubscriptionType = 'inbox' | 'sentbox'

interface ConversationQuery {
  limit?: number
  skip?: number
}

function userMessageToThread (message: UserMessage): MessageFromThread {
  const { body, createdAt, from, id, readAt, signature, to } = message
  return {
    _id: id,
    body: Buffer.from(body).toString('base64'),
    created_at: createdAt,
    read_at: readAt,
    _mod: createdAt,
    from: from,
    signature: Buffer.from(signature).toString('base64'),
    to: to
  }
}

export class MailboxManager {
  prefix: string
  senderAddress: string
  textile: Extras
  mailboxID: string
  inboxListener?: MailboxCallback
  sentboxListener?: MailboxCallback

  constructor (prefix: string, textile: Extras, senderAddress: string) {
    this.prefix = prefix
    this.textile = textile
    this.mailboxID = ''
    this.senderAddress = senderAddress
  }

  /**
   * @method init
   * @description Initializes the mailbox for the current user
   */
  async init () {
    const users: Users = this.textile.users
    this.mailboxID = await users.setupMailbox()
  }

  /**
   * @method buildMessage
   * @description Generates a Message object from the given data
   * @param to Destination address
   * @param type Message type
   * @param data message data
   * @returns a Message Object
   */
  buildMessage (to: string, type: string, data: any) {
    return {
      sender: this.senderAddress,
      to: to,
      at: Date.now(),
      type: type,
      payload: data
    }
  }

  async getConversation (
    friendIdentifier: string,
    query: ConversationQuery
  ): Promise<DecryptedMessage[]> {
    const thread = await this.textile.users.getThread('hubmail')
    const threadID = ThreadID.fromString(thread.id)

    const inboxQuery = Query.where('from')
      .eq(friendIdentifier)
      .orderByIDDesc()

    if (query?.limit) {
      inboxQuery.limitTo(query.limit)
    }

    if (query?.skip) {
      inboxQuery.skipNum(query.skip)
    }

    const encryptedInbox = await this.textile.client.find<any>(
      threadID,
      'inbox',
      inboxQuery
    )

    const lastMessageTime = encryptedInbox?.[0]?.created_at || 0
    const firstMessageTime =
      encryptedInbox?.[encryptedInbox.length - 1]?.created_at || 0

    const sentboxQuery = Query.where('to')
      .eq(friendIdentifier)
      .and('created_at')
      .ge(firstMessageTime)

    if (query?.skip && query.skip > 0) {
      sentboxQuery.and('created_at').lt(lastMessageTime)
    }

    const encryptedSentbox = await this.textile.client.find<any>(
      threadID,
      'sentbox',
      sentboxQuery
    )

    const messages = [...encryptedInbox, ...encryptedSentbox].sort(
      (a, b) => a.created_at - b.created_at
    )

    return Promise.all<DecryptedMessage>(messages.map<any>(this.decodeMessage))
  }

  /**
   * @method listenToInboxMessages
   * @description Starts a watcher on inbox messages
   * @param cb Callback function to be called
   */
  async listenToInboxMessages (cb: (message?: DecryptedMessage) => void) {
    this.inboxListener = (reply, err) => {
      if (reply?.message) {
        this.decodeMessage(userMessageToThread(reply?.message)).then(
          decrypted => {
            cb(decrypted)
          }
        )
      }
      if (reply === undefined && err === undefined) {
        this.inboxListener = undefined
        return
      }
    }
    this.textile.users.watchInbox(this.mailboxID, this.inboxListener)
  }

  /**
   * @method listenToSentboxMessages
   * @description Starts a watcher on Sentbox messages
   * @param cb Callback function to be called
   */
  listenToSentboxMessages (cb: (message?: DecryptedMessage) => void) {
    this.sentboxListener = (reply, err) => {
      if (reply?.message) {
        this.decodeMessage(userMessageToThread(reply?.message)).then(
          decrypted => {
            cb(decrypted)
          }
        )
      }
      if (reply === undefined && err === undefined) {
        this.sentboxListener = undefined
        return
      }
    }
    this.textile.users.watchSentbox(this.mailboxID, this.sentboxListener)
  }

  /**
   * @method sendMessage
   * @description Sends a message to the given recipient
   * @param to Recipient
   * @param message Message to be sent
   */
  async sendMessage (to: string, message: string) {
    const recipient: PublicKey = PublicKey.fromString(to)

    const encoder = new TextEncoder()
    const body = encoder.encode(message)
    return await this.textile.users.sendMessage(
      this.textile.identity,
      recipient,
      body
    )
  }

  /**
   * @method decodeMessage
   * @description Internal function used to decode messages
   * @param message Message to be decoded
   */
  decodeMessage = async (
    message: MessageFromThread
  ): Promise<DecryptedMessage> => {
    const identity: Identity = this.textile.identity
    const privKey = PrivateKey.fromString(identity.toString())

    const { _id, from, read_at, created_at } = message
    const msgBody = Buffer.from(message.body, 'base64')

    const bytes = await privKey.decrypt(msgBody)
    const decoded = new TextDecoder().decode(bytes)
    const body = JSON.parse(decoded)

    return { body, from, readAt: read_at, sent: created_at, id: _id }
  }

  /**
   * @method isInitialized
   * @description Checks if the mailbox is initialized for the current user
   * @returns true | false
   */
  isInitialized () {
    return this.mailboxID !== ''
  }

  /**
   * @method isSubscribed
   * @description Checks if the subscription for the given type is active
   * @param type Subscription type 'inbox' | 'sentbox'
   * @returns true | false
   */
  isSubscribed (type: MailboxSubscriptionType): boolean {
    if (type === 'inbox') {
      return Boolean(this.inboxListener)
    }

    if (type === 'sentbox') {
      return Boolean(this.sentboxListener)
    }

    return false
  }
}
