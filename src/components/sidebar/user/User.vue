<template src="./User.html"></template>

<script>
import config from '@/config/config'
import CircleIcon from '@/components/common/CircleIcon'
import DwellerCachingHelper from '@/classes/DwellerCachingHelper.ts'

import MobileUtils from '@/utils/Mobile.ts'
import * as dayjs from 'dayjs'
import * as localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(localizedFormat)

export default {
  name: 'User',
  components: {
    CircleIcon
  },
  data () {
    return {
      hovered: false,
      user: false,
      name: '',
      icon: ''
    }
  },
  props: ['friend', 'unread', 'typing', 'active', 'clientId'],
  methods: {
    /** @method
     * Formats a date using dayjs to a human readable string
     * @name formattedDate
     * @argument timestamp unicode timestamp to format
     */
    formattedDate (timestamp) {
      return dayjs(timestamp).format('LT')
    },
    /** @method
     * Returns the last recorded message from a user
     * @returns last message decoded
     */
    getLastMessage () {
      return decodeURIComponent(
        this.$store.state.lastMessages[this.friend.address].data
      )
    },
    /** @method
     * Navigates to a given user chat at a specified address
     * @argument address of the user to navigate to
     */
    navigateToUser (address) {
      this.$store.commit('changeRoute', 'main')
      // this.$store.commit('activeChat', address)
      this.$store.dispatch('setActiveChat', { friendAddress: address })
      this.$nextTick(() => {
        setTimeout(() => {
          this.$store.commit('setMobileSidebar', false)
        }, 0)
      })
    },
    // Returns if user device is mobile
    isMobile: MobileUtils.isMobile,
    isFriendConnected (address) {
      return Boolean(this.$store.state.connectedPeers[address])
    }
  },
  async mounted () {
    const dwellerCachingHelper = new DwellerCachingHelper(
      this.$ethereum,
      config.registryAddress
    )
    const dweller = await dwellerCachingHelper.getDweller(this.clientId)
    this.name = dweller.name
    this.icon = dweller.photo
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./User.less"></style>
