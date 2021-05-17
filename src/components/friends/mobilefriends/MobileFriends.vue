<template src="./MobileFriends.html"></template>

<!--
  Friends.vue
  List all friends a user has. Allows for searching and chatting
-->
<script>
import MobileNav from '@/components/sidebar/mobilenav/MobileNav'
import TopNav from '@/components/common/mobile/TopNav'

import WalletAddressMini from '@/components/common/wallet/WalletAddressMini'
import QRDisplay from '@/components/common/QRDisplay'
import QRScan from '@/components/common/QRScan'

import config from '@/config/config'
// Components
import CircleIcon from '@/components/common/CircleIcon'
import FriendRequests from '@/components/friends/mobilefriends/requests/FriendRequests'
// Classes
import DwellerCachingHelper from '@/classes/DwellerCachingHelper.ts'
import Friend from '@/components/friends/friend/Friend'
// Utilities
import { getAlphaSorted, getFilteredFriends } from '@/utils/FriendsUtils.ts'
import { Plugins } from '@capacitor/core'

export default {
  name: 'MobileFriends',
  props: ['toggleSettings'],
  components: {
    CircleIcon,
    Friend,
    FriendRequests,
    WalletAddressMini,
    QRDisplay,
    QRScan,
    MobileNav,
    TopNav
  },
  data () {
    return {
      showShareQR: false,
      showScanQR: false,
      showScanQRIOS: false,
      showMainContent: true,
      showMobileNav: true,
      keyword: '',
      friends: Array.from(this.$store.state.friends),
      sortedFriends: false,
      error: false,
      success: false,
      friend: false,
      friendAddress: '',
      makingRequest: {},
      removingFriend: {},
      dwellerCachingHelper: new DwellerCachingHelper(
        this.$ethereum,
        config.registry[config.network.chain],
        config.cacher.dwellerLifespan
      )
    }
  },
  mounted () {
    this.update()
  },
  methods: {
    toggleShareQR () {
      this.showShareQR = !this.showShareQR
    },
    async toggleScanQR () {
      let isNativeIOS = Capacitor.getPlatform() == 'ios' // returns ios, web or android
      isNativeIOS ? this.startScanIOS() : (this.showScanQR = !this.showScanQR)
    },
    async startScanIOS () {
      this.changeBackgroundOpacity('body', 0)
      this.changeBackgroundOpacity('#wrapper', 0)
      this.changeBackgroundOpacity('#friends', 0)

      this.showScanQRIOS = !this.showScanQRIOS
      this.showMainContent = !this.showMainContent
      this.showMobileNav = !this.showMobileNav

      await this.checkPermission()
      const { BarcodeScanner } = Plugins
      BarcodeScanner.hideBackground()
      const result = await BarcodeScanner.startScan()

      if (result.hasContent) {
        this.setFriend(result.content)
        this.stopScanIOS()
      }
    },
    stopScanIOS () {
      this.changeBackgroundOpacity('body', 1)
      this.changeBackgroundOpacity('#wrapper', 1)
      this.changeBackgroundOpacity('#friends', 1)

      const { BarcodeScanner } = Plugins
      BarcodeScanner.showBackground()
      BarcodeScanner.stopScan()

      this.showScanQRIOS = !this.showScanQRIOS
      this.showMainContent = !this.showMainContent
      this.showMobileNav = !this.showMobileNav
    },
    changeBackgroundOpacity (selector, opacity) {
      let el = document.querySelector(selector)
      let bg = window.getComputedStyle(el).getPropertyValue('background-color')
      let split = bg
        .split('(')[1]
        .split(')')[0]
        .split(',')
      let newBG = `rgba(${split[0]},${split[1]},${split[2]},${opacity})`
      el.style.setProperty('background', newBG, 'important')
    },
    setFriend (address) {
      this.friendAddress = address
      this.addFriendQR()
    },
    async checkPermission () {
      const { BarcodeScanner } = Plugins
      // check or request permission
      const status = await BarcodeScanner.checkPermission({ force: true })
      if (status.granted) {
        return true // the user granted permission
      }
      return false
    },
    // Imported from utils
    getAlphaSorted,
    getFilteredFriends,
    update () {
      this.fetchFriendRequests()
      // this.$store.dispatch('fetchFriends', this.$store.state.activeAccount)
    },
    getFriends () {
      this.friends = this.$store.state.friends
    },
    /** @method
     * Get all the friend requests that are actively stored on chain
     * @name fetchFriendRequests
     */
    async fetchFriendRequests () {
      // this.$store.dispatch('fetchFriendRequests')
    },
    /** @method
     * Remove friend
     * @name removeFriend
     * @argument friendAddress Friends ether address
     */
    async removeFriend (address) {
      this.removingFriend = { address: address, removed: false }
      await this.$WebRTC.disconnectFromPeer(address)
      await this.$store.dispatch('removeFriend', address)
      this.removingFriend = { address: address, removed: true }
    },
    /** @method
     * Update all store values so to chat with the given client
     * @name chatFriend
     * @argument address client to chat with referenced by address
     */
    chatFriend (address) {
      this.$store.commit('newChat', address)
      // this.$store.commit('activeChat', address)
      this.$store.dispatch('setActiveChat', { friendAddress: address })
      this.$store.commit('changeRoute', 'main')
    },
    /** @method
     * Cleanup after adding a friend
     * @name reset
     */
    reset () {
      this.error = false
      this.friendAddress = ''
      this.friend = false
    },
    /** @method
     * Close the component and reroute to main
     * @name close
     */
    close () {
      this.$store.commit('setMobileSidebar', true)
    },
    /** @method
     * Do some checks to make sure the friend is valid
     * and then display them if they are found so they
     * can be confirmed and added
     * @name addFriend
     */
    async addFriend () {
      if (!this.$ethereum.utils.isAddress(this.friendAddress)) {
        this.error = "Whoops, that's not a valid address"
        return
      }
      if (this.friendAddress === this.$store.state.activeAccount) {
        this.error = "You can't add yourself you silly goose."
        return
      }
      if (
        this.$store.state.friends.filter(f => f.address === this.friendAddress)
          .length === 1
      ) {
        this.error = "You're already friends with this user."
        return
      }
      const friend = await this.dwellerCachingHelper.getDweller(
        this.friendAddress
      )
      if (!friend) {
        this.error = "Hmm, we couldn't find a user at that address"
        return
      }
      this.error = false
      this.friend = { ...friend, status: 'unchecked' }
      this.$toasted.show('ATTN: Friend Added!', {
        type: 'success',
        icon: 'check-circle'
      })
      this.showScanQR = false
    },
    /** @method
     * Do some checks to make sure the friend is valid
     * and then display them if they are found so they
     * can be confirmed and added
     * @name addFriend
     */
    async addFriendQR () {
      if (!this.$ethereum.utils.isAddress(this.friendAddress)) {
        this.$toasted.show('Invalid Address', {
          type: 'error',
          icon: 'check-circle'
        })
        return
      }
      if (this.friendAddress === this.$store.state.activeAccount) {
        this.$toasted.show("You can't add yourself.", {
          type: 'error',
          icon: 'check-circle'
        })
        return
      }
      if (
        this.$store.state.friends.filter(f => f.address === this.friendAddress)
          .length === 1
      ) {
        this.$toasted.show("You're already friends with this user.", {
          type: 'error',
          icon: 'check-circle'
        })
        return
      }
      const friend = await this.dwellerCachingHelper.getDweller(
        this.friendAddress
      )
      if (!friend) {
        this.$toasted.show("Hmm, we couldn't find a user at that address", {
          type: 'error',
          icon: 'check-circle'
        })
        return
      }
      this.error = false
      this.friend = { ...friend, status: 'unchecked' }
      await this.sendFriendRequest()
      this.showScanQR = false
      this.$toasted.show('ATTN: Friend Found!', {
        type: 'success',
        icon: 'check-circle'
      })
    },
    /** @method
     * Sends a friend request to the active friend
     * This will create a thread for the users as well if one does not exist
     * @name sendFriendRequest
     */
    async sendFriendRequest () {
      // TODO: update to receive the address as parameter
      const address = this.friendAddress

      this.makingRequest = { ...this.makingRequest, [address]: true }

      await this.$store.dispatch('sendFriendRequest', {
        address,
        guestPublicKey: this.friend.pubkey
      })

      this.makingRequest = { ...this.makingRequest, [address]: false }

      this.reset()
    },
    /** @method
     * Confirms and adds a found friend
     * @name commitFriend
     */
    commitFriend () {
      this.update()
      this.success = `${this.friend.name} has been added to your friendslist.`
      setTimeout(() => {
        this.success = false
      }, 2000)
      this.reset()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./MobileFriends.less"></style>
