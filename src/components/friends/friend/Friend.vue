<template src="./Friend.html"></template>

<!--
  Friend.vue
  Represents a singular friend
-->
<script>
import CircleIcon from '@/components/common/CircleIcon'
import Badge from '@/components/common/Badge'
import MobileUtils from '@/utils/Mobile.ts'

export default {
  name: 'Friend',
  props: [
    'action',
    'text',
    'friend',
    'makingRequest',
    'removeFriend',
    'add',
    'containsOptions',
    'removingFriend'
  ],
  components: {
    CircleIcon,
    Badge
  },
  watch: {
    removingFriend (newValue) {
      if (
        newValue.address === this.friend.address &&
        newValue.removed === true
      ) {
        this.isFriend = false
      }
    }
  },
  data () {
    return {
      friendOptions: false,
      confirmRemove: false,
      isFriend: true,
      showOptions: false
    }
  },
  methods: {
    isMobile: MobileUtils.isMobile,
    isMakingRequest (address) {
      return this.makingRequest && this.makingRequest[address]
    },
    toggleFriendOptions () {
      this.confirmRemove = false
      this.friendOptions = !this.friendOptions
    },
    toggleRemoveFriend () {
      this.friendOptions = false
      this.confirmRemove = !this.confirmRemove
    },
    isRemovingFriend (address) {
      return this.removingFriend && this.removingFriend.address === address
    },
    showFriendOptions () {
      if (this.isMobile()) {
        this.showOptions = true
      }
    },
    isFriendConnected (address) {
      return Boolean(this.$store.state.connectedPeers[address])
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./Friend.less"></style>
