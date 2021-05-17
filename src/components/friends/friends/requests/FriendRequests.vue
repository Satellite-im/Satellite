<template src="./FriendRequests.html"></template>

<script>
import config from '@/config/config'
import Friends from '@/classes/contracts/Friends.ts'
import DwellerCachingHelper from '@/classes/DwellerCachingHelper.ts'

export default {
  name: 'FriendRequests',
  props: ['action', 'fetchFriendRequests', 'friendRequests', 'outgoing'],
  data () {
    return {
      requestPending: {},
      friendsContract: null
    }
  },
  mounted () {
    this.friendsContract = new Friends(
      this.$ethereum,
      config.friends[config.network.chain]
    )
    this.dwellerCachingHelper = new DwellerCachingHelper(
      this.$ethereum,
      config.registryAddress,
      config.cacher.dwellerLifespan
    )
  },
  methods: {
    async acceptRequest (request) {
      const address = request.address

      this.makingRequest = Object.assign({}, this.makingRequest, {
        [address]: true
      })

      this.requestPending = Object.assign({}, this.requestPending, {
        [address]: true
      })

      console.log('request', request)

      await this.$store.dispatch('acceptRequest', {
        address,
        guestPublicKey: request.pubkey
      })

      this.requestPending = Object.assign({}, this.requestPending, {
        [address]: false
      })
    },
    async denyRequest (address) {
      this.$store.dispatch('denyRequest', { address })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./FriendRequests.less"></style>
