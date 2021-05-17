export default {
  /**
   * @description Initializes the p2p connection and all the
   * needed listeners
   */
  async initP2P ({ commit, dispatch, state }) {
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC
    // @ts-ignore
    const SoundManager = this.$app.$sound
    // @ts-ignore
    const streamManager = this.$app.$streamManager

    WebRTC.subscribe(
      (event: string, identifier: string, { type, data }) => {
        dispatch('setFriendStatus', { address: identifier, connected: true })
      },
      ['connect']
    )

    // Watch for users typing
    WebRTC.subscribe(
      (event, identifier, message) => {
        commit('userTyping', [identifier, message.data])
      },
      ['typing-notice'],
      state.activeChats
    )

    // Watch for users typing
    WebRTC.subscribe(
      (event, identifier, message) => {
        commit('incomingCall', identifier)
        SoundManager.play('callingSound')
      },
      ['incoming-call']
    )

    WebRTC.subscribe(
      (event, identifier, message) => {
        SoundManager.stop('callingSound')
        SoundManager.stop('connectedSound')
      },
      ['call-answered']
    )

    WebRTC.subscribe(
      (event, identifier, message) => {
        SoundManager.play('callingSound')
      },
      ['outgoing-call']
    )

    WebRTC.subscribe(
      (event, identifier, { type, data }) => {
        SoundManager.stop('callingSound')
        SoundManager.stop('connectedSound')
        streamManager.addRemoteStream(identifier, data[0])
        streamManager.playStream('remote', identifier)
      },
      ['call-stream']
    )

    WebRTC.subscribe(
      (event, identifier, message) => {
        SoundManager.stop('callingSound')
        SoundManager.play('hangupSound')

        streamManager.stopStream('remote', identifier)
        streamManager.stopStream('local', identifier)
      },
      ['call-ended']
    )

    WebRTC.subscribe(
      (event, identifier, message) => {
        dispatch('setFriendStatus', { address: identifier, connected: false })
      },
      ['disconnect']
    )
  },
  /**
   * @description Tries to initiate a p2p connection to a given set of friends
   */
  async tryConnectToFriends ({ dispatch }, { friends }) {
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC

    friends.forEach(async friend => {
      if (!WebRTC.isPeerConnected(friend.address)) {
        dispatch('initiateConnection', { friend })
      }
    })
  },
  /**
   * @description Tries to initiate a p2p connection to a given friend
   */
  async initiateConnection ({}, { friend }) {
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC
    // @ts-ignore
    const crypto = this.$app.$crypto

    // Initialize the ECDH encryption for the given friend
    await crypto.initializeRecipient(friend.address, friend.pubkey)
    // Retrieve the hashed value of the shared secret
    const secret = crypto.getSecret(friend.address)

    // Initiate the P2P connection using the shared secret
    await WebRTC.initiateConnection(friend.address, secret)
  },
  /**
   * @description Try to call a given friend
   */
  async call ({ commit, dispatch }, { friendAddress, stream }) {
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC
    // @ts-ignore
    const streamManager = this.$app.$streamManager

    // Close active call
    WebRTC.getActiveCalls().forEach(activeCall => {
      activeCall[1].hangupCall()
    })

    await WebRTC.call(friendAddress, stream)

    // Add the local stream using the recipient address as id
    streamManager.addLocalStream(friendAddress, stream)

    commit('addActiveCall', friendAddress)
    dispatch('sendMessage', { data: Date.now(), type: 'call' })
  },
  /**
   * @description Allow to answer to an incoming call from a friend
   */
  async answerCall ({ commit, dispatch }, { friend, stream }) {
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC
    // @ts-ignore
    const streamManager = this.$app.$streamManager

    // Add the local stream using the sender address as id
    streamManager.addLocalStream(friend.address, stream)

    // Close active call
    WebRTC.getActiveCalls().forEach(activeCall => {
      activeCall[1].hangupCall()
      streamManager.stopStream('remote', activeCall)
      streamManager.stopStream('local', activeCall)
    })

    await WebRTC.answerCall(friend.address, stream)

    commit('incomingCall', false)
    commit('addActiveCall', friend.address)
    dispatch('setActiveChat', { friendAddress: friend.address })
  },
  /**
   * @description Allows to hang up a call even if it incoming or active
   */
  async hangupCall ({ commit }, { friendAddress }) {
    // @ts-ignore
    const WebRTC = this.$app.$WebRTC

    await WebRTC.hangupCall(friendAddress)

    commit('removeActiveCall', friendAddress)
  }
}
