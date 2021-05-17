<template src="./Conversation.html"></template>

<!--
  conversation.vue
  This component houses the current active conversation
-->
<script>
import MessageUtils from '@/utils/MessageUtils'
import MessageBody from '@/components/conversation/message/messagebody/MessageBody'
import Divider from '@/components/common/Divider'
import Stickers from '@/components/common/stickers/Stickers'

import MobileUtils from '@/utils/Mobile.ts'

export default {
  name: 'Conversation',
  props: ['messages', 'sendMessage', 'mediaOpen', 'voice', 'fetchMessages'],
  components: {
    MessageBody,
    Divider,
    Stickers
  },
  data () {
    return {
      showScrollToBottom: false,
      subscribed: false,
      threadExists: false,
      messageCount: this.$store.state.messages.length,
      prevScroll: 0,
      loadingMore: false
    }
  },
  updated () {},
  methods: {
    grouper: MessageUtils.group,
    // Returns if user device is mobile
    isMobile: MobileUtils.isMobile,
    /**
     * @method
     * Scroll to a specific position
     * @name scrollTo
     */
    scrollTo (height) {
      const { chat } = this.$refs
      if (!chat) return

      setTimeout(() => {
        chat.scrollTo({ top: height, behavior: 'smooth' })
        this.checkScrollToBottom()
      }, 50)
    },
    /**
     * @method
     * Checks if the scroll to bottom buttom must be shown or not
     * @name checkScrollToBottom
     */
    checkScrollToBottom () {
      const { chat } = this.$refs
      if (!chat) return
      // If the scroll position is at least 100 pixel from the bottom,
      // shows the scrollToBottom button
      const currentPosition = chat.scrollHeight - chat.scrollTop
      if (currentPosition - chat.offsetHeight > 100) {
        this.showScrollToBottom = true
      } else {
        this.showScrollToBottom = false
      }
    },
    /** @method
     * Rudementary scrolling to the bottom of the
     * div when a message comes in, or on other events
     * @name scrollToEnd
     */
    scrollToEnd () {
      const { chat } = this.$refs
      if (!chat) return

      this.scrollTo(chat.scrollHeight)
    },
    /**
     * @method
     * Set the initial scroll to the bottom to see the latest
     * messages
     * @name initialScroll
     */
    initialScroll () {
      const { chat } = this.$refs
      if (!chat) return

      chat.scrollTop = chat.scrollHeight
    },
    /** @method
     * Scrolls to the end if the user isn't looking through message
     * history to prevent annoying jumping
     * @name scrollToEndConditionally
     */
    scrollToEndConditionally (newMessages) {
      const { chat } = this.$refs
      if (!chat) return

      if (this.loadingMore) {
        this.loadingMore = false
        return
      }

      if (newMessages) {
        this.scrollToEnd()
      }
    },
    /** @method
     * If we've scrolled past a certain point we will
     * display the scroll to bottom button
     * @name onScroll
     */
    onScroll () {
      const { chat } = this.$refs
      if (!chat) return

      const scrollPercentage = (chat.scrollTop / chat.scrollHeight) * 100

      const scrollDirection = chat.scrollTop > this.prevScroll ? 'down' : 'up'

      this.prevScroll = chat.scrollTop

      if (
        scrollPercentage < 50 &&
        !this.loadingMore &&
        !this.$store.state.messagesLimit.end &&
        scrollDirection === 'up'
      ) {
        this.loadingMore = true
        this.$store.dispatch('loadMoreMessages', {
          address: this.$store.state.activeChat
        })
      }

      this.checkScrollToBottom()
    },
    markRead () {
      // If we get a message update the last read messages to mark it as read
      this.$store.commit('markRead', this.$store.state.activeChat)
    }
  },
  watch: {
    mediaOpen: 'scrollToEnd'
  },
  beforeDestroyed () {
    // Close subscription
    this.subscribed()
  },
  mounted () {
    // This is to track changes in addresses, I couldn't find a way to do this with subscribe
    let lastChat = this.$store.state.activeChat
    this.subscribed = this.$store.subscribe(mutation => {
      if (mutation.type === 'activeChat') {
        this.$nextTick(() => this.scrollToEnd())
        this.markRead()

        if (lastChat !== mutation.payload) {
          lastChat = mutation.payload
        }
      }
      if (mutation.type === 'updateMessages') {
        const newMessages =
          this.messageCount !== mutation.payload.messages.length
        this.messageCount = mutation.payload.messages.length

        this.scrollToEndConditionally(newMessages)
        this.markRead()
      }
      if (mutation.type === 'appendMessage') {
        this.scrollToEnd()
        this.markRead()
      }
    })

    //scrolls chat to the bottom upon opening chat
    setTimeout(() => this.initialScroll(), 50)
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped lang="less" src="./Conversation.less"></style>
