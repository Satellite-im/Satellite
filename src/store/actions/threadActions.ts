import ThreadID from '@textile/threads-id'
import Database from '../../classes/database/Database'

export default {
  async subscribeToThread ({ state, commit, dispatch }, { friend }) {
    // @ts-ignore
    const database = this.$app.$database
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC
    // @ts-ignore
    const SoundManager = this.$app.$sound

    const threadID = ThreadID.fromString(friend.threadID)

    // Subscribe to thread events.
    await database.messageManager.subscribe(
      threadID,
      async update => {
        if (update.instance.sender !== state.activeChat) {
          // Add an unread message indicator and if the user isn't in our sidebar,
          // add a new chat group for them.
          commit('markUnread', update.instance.sender)
          commit('newChat', update.instance.sender)
        }

        if (friend.pubkey) {
          const decrypted = await database.messageManager.decryptMessage(
            update.instance,
            friend.pubkey
          )
          state.lastMessages[update.instance.sender] = {
            ...decrypted.payload,
            at: Date.now()
          }
          if (
            update.instance.sender === state.activeChat ||
            update.instance.sender === state.activeAccount
          ) {
            commit('appendMessage', decrypted)
          }
        } else if (
          update.instance.sender === state.activeChat ||
          update.instance.sender === state.activeAccount
        ) {
          commit('appendMessage', update.instance)
        }

        if (
          update.instance.sender !== state.activeAccount &&
          (update.instance.sender !== state.activeChat || !document.hasFocus())
        ) {
          SoundManager.play('newMessage')
        }

        // If we're recieving messages from a peer and they are not connected, try to connect.
        // WebRTC.connectIfNotConnected(update.instance.sender);
      },
      () => {
        dispatch('subscribeToThread', { friend })
      }
    )
  },
  unsubscribeFromThread ({}, { friend }) {
    // @ts-ignore
    const database = this.$app.$database

    database.unsubscribeFromThread(friend.threadID)
  },
  subscribeToAllThreads ({ dispatch, state }, { friends }) {
    const friendsToLoop = friends ? friends : state.friends

    // @ts-ignore
    const database = this.$app.$database

    friendsToLoop.forEach(friend => {
      if (!database.messageManager.isSubscribed(friend.threadID)) {
        dispatch('subscribeToThread', { friend })
      }
    })
  },
  async fetchMessages ({ state, commit }, { address }) {
    // @ts-ignore
    const database = this.$app.$database
    const friend = state.friends.find(friend => friend.address === address)

    if (!friend) return

    commit('loadingMessages')
    const messages = await database.messageManager?.getMessages(
      friend.threadID.toString()
    )

    const decrypted = await database.messageManager?.bulkDecrypt(
      messages,
      friend.pubkey
    )
    commit('updateMessages', decrypted)
  },
  async sendMessageOld ({ state, commit }, { type, data }) {
    // @ts-ignore
    const database = this.$app.$database
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC

    const recipient = state.friends.find(
      friend => friend.address === state.activeChat
    )

    if (database.messageManager) {
      const msg = database.messageManager.buildMessage(
        state.activeChat,
        Date.now(),
        'message',
        {
          type: type || 'text',
          data: type === 'text' ? encodeURI(data) : data
        }
      )

      // Mark the message as pending when it's not yet included in the thread
      commit('appendMessage', { ...msg, pending: true })

      const threadID = ThreadID.fromString(recipient.threadID)

      // If we have their public key, we will encrypt their message
      database.messageManager.addMessageDeterministically(
        threadID,
        msg,
        recipient.pubkey
      )

      // const peer = WebRTC.find(state.activeChat);

      // if (peer?.isAlive) {
      //   peer.send(
      //     'message',
      //     {
      //       type: type || 'text',
      //       data,
      //     },
      //   );
      // }
    }
  }
}
