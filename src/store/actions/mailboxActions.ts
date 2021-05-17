import config from '../../config/config'
import { uniqBy } from 'lodash'

/**
 * @description Utility function to convert message from the new to the
 * previous version. Will be handled differently in Absolute
 * @param msg message object
 * @returns the converted message object
 */
function convertMsg (msg) {
  return {
    id: msg.id,
    from: msg.from,
    readAt: msg.readAt,
    sent: msg.sent,
    sender: msg.body.sender,
    to: msg.body.to,
    at: msg.body.at,
    payload: msg.body.payload,
    metadata: msg.body.metadata
  }
}

export default {
  /**
   * @description Fetches the user mailbox retrieving messages from the active chat
   */
  async fetchMailbox ({ state, commit }, { address }) {
    // @ts-ignore
    const database = this.$app.$database
    // @ts-ignore
    const crypto = this.$app.$crypto

    const friend = state.friends.find(fr => fr.address === address)

    commit('loadingMessages')

    // Initialize the crypto library for the recipient to compute ECDH
    await crypto.initializeRecipient(friend.address, friend.pubkey)

    const decryptedKey = await crypto.decryptFor(
      friend.address,
      friend.encryptedKey
    )

    const limit = { limit: config.messaging.defaultLimit, skip: 0 }

    const conversation = await database.mailboxManager?.getConversation(
      decryptedKey,
      limit
    )

    commit('updateMessages', {
      messages: conversation.map(convertMsg),
      messagesLimit: limit
    })
  },
  /**
   * @description Loads more messages for the active chat starting from the
   * latest fetched messages
   * Limits can be set in config
   */
  async loadMoreMessages ({ state, commit }, { address }) {
    // @ts-ignore
    const database = this.$app.$database
    // @ts-ignore
    const crypto = this.$app.$crypto

    const friend = state.friends.find(fr => fr.address === address)

    // Initialize the crypto library for the recipient to compute ECDH
    await crypto.initializeRecipient(friend.address, friend.pubkey)

    const decryptedKey = await crypto.decryptFor(
      friend.address,
      friend.encryptedKey
    )

    const currentLimit = state.messagesLimit
    const newLimit = {
      limit: config.messaging.defaultLimit,
      skip: currentLimit.skip + config.messaging.loadMoreCount
    }

    const conversation = await database.mailboxManager?.getConversation(
      decryptedKey,
      newLimit
    )

    const prevLength = state.messages.length

    const newMessages = uniqBy(
      [...conversation.map(convertMsg), ...state.messages],
      'id'
    ).sort((a, b) => a.at - b.at)

    commit('updateMessages', {
      messages: newMessages,
      messagesLimit: { ...newLimit, end: newMessages.length === prevLength }
    })
  },
  /**
   * @description Subscribes to the user mailbox, if not already subscribed, and eventually
   * updates messages in the active chat
   */
  async subscribeToMailbox ({ state, commit }) {
    // @ts-ignore
    const database = this.$app.$database
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC
    // @ts-ignore
    const SoundManager = this.$app.$sound

    // Watch for users typing
    WebRTC.subscribe(
      identifier => {
        if (!database.mailboxManager?.isSubscribed('inbox')) {
          database.mailboxManager?.listenToInboxMessages(message => {
            const msg = convertMsg(message)

            if (msg.sender !== state.activeChat) {
              // Add an unread message indicator and if the user isn't in our sidebar,
              // add a new chat group for them.
              commit('markUnread', msg.sender)
              commit('newChat', msg.sender)
            }

            const friend = state.friends.find(f => f.address === identifier)

            if (friend?.pubkey) {
              state.lastMessages[msg.sender] = {
                ...msg.payload,
                at: Date.now()
              }

              if (
                msg.sender === state.activeChat ||
                msg.sender === state.activeAccount
              ) {
                commit('appendMessage', msg)
              }
            } else if (
              msg.sender === state.activeChat ||
              msg.sender === state.activeAccount
            ) {
              commit('appendMessage', msg)
            }

            if (
              msg.sender !== state.activeAccount &&
              (msg.sender !== state.activeChat || !document.hasFocus())
            ) {
              SoundManager.play('newMessage')
            }
          })
        }
      },
      ['typing-notice'],
      state.friends.map(friend => friend.address)
    )
  },
  /**
   * @description Subscribes to the user sentbox and eventually
   * appends sent messages to the active chat
   */
  async subscribeToSentbox ({ commit }) {
    // @ts-ignore
    const database = this.$app.$database

    // Watch for users typing
    if (!database.mailboxManager?.isSubscribed('sentbox')) {
      database.mailboxManager?.listenToSentboxMessages(message => {
        const msg = convertMsg(message)
        commit('appendMessage', msg)
      })
    }
  },
  /**
   * @description Sends a new message in the active chat
   */
  async sendMessage ({ state }, { type, data }) {
    // @ts-ignore
    const database = this.$app.$database
    // @ts-ignore
    const crypto = this.$app.$crypto

    const recipient = state.friends.find(
      friend => friend.address === state.activeChat
    )

    // Initialize the crypto library for the recipient to compute ECDH
    await crypto.initializeRecipient(recipient.address, recipient.pubkey)

    const decryptedKey = await crypto.decryptFor(
      recipient.address,
      recipient.encryptedKey
    )

    const msg = database.mailboxManager?.buildMessage(
      state.activeChat,
      'message',
      {
        type: type || 'text',
        data: type === 'text' ? encodeURI(data) : data
      }
    )

    await database.mailboxManager?.sendMessage(
      decryptedKey,
      JSON.stringify(msg)
    )

    // Mark the message as pending when it's not yet included in the thread
    // commit('appendMessage', { ...msg, pending: true })
  }
}
