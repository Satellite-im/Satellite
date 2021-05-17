import config from '../../config/config'
import DwellerCachingHelper from '../../classes/DwellerCachingHelper'
import Friends, { FriendsEvents } from '../../classes/contracts/Friends'
import IFriend from '../../interfaces/IFriend'

export default {
  async fetchFriends ({ commit, dispatch }) {
    // @ts-ignore
    const friendsContract = new Friends(
      // @ts-ignore
      this.$app.$ethereum,
      config.friends[config.network.chain]
    )

    // Get the friends from chain
    const friends = await friendsContract.getFriends()

    let updatedFriends: Array<IFriend> = []

    if (friends.length > 0) {
      const dwellerCachingHelper = new DwellerCachingHelper(
        // @ts-ignore
        this.$app.$ethereum,
        config.registry[config.network.chain],
        config.cacher.dwellerLifespan
      )

      // Join data from cachingHelper and friends contract
      const getData = async (friend): Promise<IFriend> => {
        const dwellerCache = await dwellerCachingHelper.getDweller(
          friend.dweller
        )

        return {
          ...dwellerCache,
          encryptedKey: friend.encryptedKey
        }
      }

      const parsedFriends = await Promise.all<IFriend>(friends.map(getData))

      updatedFriends = parsedFriends?.sort((a: IFriend, b: IFriend): any =>
        a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1
      )
      updatedFriends = parsedFriends
    }

    // Dispatch a databaseAction to subscribe to friends threads
    // dispatch('subscribeToAllThreads', { friends: updatedFriends })

    // dispatch('subscribeToMailbox', { friend: updatedFriends[0] })
    // dispatch('fetchMailbox', {friend})

    // Dispatch a p2pAction to subscribe for signals
    dispatch('tryConnectToFriends', { friends: updatedFriends })

    // TODO: eventually limit UI updates if friends didn't change
    //   !state.friendsLoaded ||
    //   JSON.stringify(state.friends) !== JSON.stringify(updatedFriends)

    // Commit changes to the store
    commit('updateFriends', updatedFriends)
  },
  async startFriendsListeners ({ dispatch }) {
    // @ts-ignore
    const friendsContract = new Friends(
      // @ts-ignore
      this.$app.$ethereum,
      config.friends[config.network.chain]
    )

    friendsContract.startAllListeners(eventName => {
      dispatch('fetchFriendRequests')

      if (eventName === FriendsEvents.FriendRequestAccepted) {
        dispatch('fetchFriends')
      }
    })
  },
  async fetchFriendRequests ({ commit }) {
    // @ts-ignore
    const friendsContract = new Friends(
      // @ts-ignore
      this.$app.$ethereum,
      config.friends[config.network.chain]
    )

    const dwellerCachingHelper = new DwellerCachingHelper(
      // @ts-ignore
      this.$app.$ethereum,
      config.registry[config.network.chain],
      config.cacher.dwellerLifespan
    )

    const requests = await friendsContract.getRequests()
    const requestsPromise = requests.map(async request => {
      const friendData = await dwellerCachingHelper.getDweller(request[0])

      return { ...friendData, address: request[0], publicKey: request[1] }
    })

    const parsedRequests = await Promise.all(requestsPromise)

    commit('updateFriendRequests', parsedRequests)
  },
  async sendFriendRequest ({}, { address, guestPublicKey }) {
    // @ts-ignore
    const crypto = this.$app.$crypto
    // @ts-ignore
    const database = this.$app.$database

    // Retrieve the textile identity object
    const identity = await database.identityManager?.identity

    // Initialize the crypto library for the recipient to compute ECDH
    await crypto.initializeRecipient(address, guestPublicKey)

    // Encrypt data using the ECDH key that has been computed for the
    // given recipient
    const encrypted = await crypto.encryptFor(
      address,
      identity?.public?.toString()
    )

    // Creating the Friends contract instance
    // @ts-ignore
    const friendsContract = new Friends(
      // @ts-ignore
      this.$app.$ethereum,
      config.friends[config.network.chain]
    )

    // Calling the contract function to create a request
    // passing the Textile encrypted public key as argument
    await friendsContract
      .makeRequest(address, encrypted)
      .catch(e => console.log('error', e))
  },
  async acceptRequest ({ dispatch }, { address, guestPublicKey }) {
    // @ts-ignore
    const crypto = this.$app.$crypto
    // @ts-ignore
    const database = this.$app.$database

    // Retrieve the textile identity object
    const identity = await database.identityManager?.identity

    // Initialize the crypto library for the recipient to compute ECDH
    await crypto.initializeRecipient(address, guestPublicKey)

    // Encrypt data using the ECDH key that has been computed for the
    // given recipient
    const encrypted = await crypto.encryptFor(
      address,
      identity?.public?.toString()
    )

    // Creating the Friends contract instance
    // @ts-ignore
    const friendsContract = new Friends(
      // @ts-ignore
      this.$app.$ethereum,
      config.friends[config.network.chain]
    )

    // Calling the contract function to accept a request
    // passing the Textile encrypted public key as argument
    await friendsContract.acceptRequest(address, encrypted)

    dispatch('fetchFriendRequests')
    dispatch('fetchFriends')
  },
  async denyRequest ({ dispatch }, { address }) {
    // @ts-ignore
    const friendsContract = new Friends(
      // @ts-ignore
      this.$app.$ethereum,
      config.friends[config.network.chain]
    )

    await friendsContract.denyRequest(address).catch(console.log)
    dispatch('fetchFriendRequests')
  },
  async setFriendStatus ({ commit }, { address, connected }) {
    commit('updateConnectedPeers', { address, connected })
  },
  async removeFriend ({ commit, state }, address) {
    // @ts-ignore
    const friendsContract = new Friends(
      // @ts-ignore
      this.$app.$ethereum,
      config.friends[config.network.chain]
    )
    // @ts-ignore
    await friendsContract.removeFriend(address)

    commit('removeFriend', address)
    state.activeChats.length > 0
      ? commit('activeChat', state.activeChats[0])
      : commit('activeChat', false)
  }
}
