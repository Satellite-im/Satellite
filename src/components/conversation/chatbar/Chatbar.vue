<template src="./Chatbar.html"></template>

<!--
  Chatbar.vue
  The input box and clickable icons to manage emojis
  send Ether, upload files and send messages to users
-->
<script>
import debounce from 'debounce'

import data from '@/components/conversation/chatbar/emojidata.json'
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast'
import MiniPayment from '@/components/common/payments/minipayment/MiniPayment'
import MiniPaymentMobile from '@/components/common/payments/minipaymentmobile/MiniPaymentMobile'
import 'emoji-mart-vue-fast/css/emoji-mart.css'
import FileUpload from '@/components/common/fileupload/FileUpload'

import CommandParser from './commandparser/CommandParser'

import MobileUtils from '@/utils/Mobile.ts'

const emojiIndex = new EmojiIndex(data)

export default {
  name: 'ChatGroup',
  props: ['handleNewMessage'],
  components: {
    Picker,
    MiniPayment,
    MiniPaymentMobile,
    FileUpload,
    CommandParser
  },
  data () {
    return {
      messageText: '',
      selectingEmoji: false,
      emojiIndex,
      typing: false,
      payments: false,
      characters: 0,
      limit: 250,
      file: false,
      showFileUpload: false,
      command: false,
      args: false
    }
  },
  mounted () {
    let messageBox = document.querySelector('.messageuser')
    if (messageBox) {
      messageBox.style.setProperty('background', 'transparent', 'important')
    }
  },
  methods: {
    isMobile: MobileUtils.isMobile,
    openStickers () {
      //code to check if any of the other modals are open, if so close them
      if(this.selectingEmoji ) {this.selectingEmoji = !this.selectingEmoji };
      if(this.payments) {this.payments = !this.payments };

      //code to toggle Stickers modal
      this.$store.commit('toggleStickers', true)
    },
    /** @method
     * Handle the pasting of image files and start the upload of the file
     * @name handlePaste
     * @argument e paste DOM event
     */
    handlePaste (e) {
      for (let i = 0; i < e.clipboardData.items.length; i += 1) {
        const item = e.clipboardData.items[i]
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          this.file = file
          this.showFileUpload = true
        }
      }
    },
    /** @method
     * When a file has been succesfully uploaded, show the uploader
     * @name openFileUpload
     */
    openFileUpload () {
      this.showFileUpload = true
    },
    /** @method
     * Self explanatory, close the file uploader modal
     * @name closeFileUpload
     */
    closeFileUpload () {
      this.showFileUpload = false
      this.file = false
    },
    // Toggles the visibility of the mini payment window
    togglePayments () {
      //code to check if any of the other modals are open, if so close them
      if(this.selectingEmoji ) {this.selectingEmoji = !this.selectingEmoji };
      if(this.$store.state.stickersOpen) {this.$store.commit('toggleStickers', true)};
      
      //code to toggle payment modal
      this.payments = !this.payments
    },
    // Toggles visibility of the emoji picker
    toggleEmoji () {
      //code to check if any of the other modals are open, if so close them
      if(this.payments) {this.payments = !this.payments };
      if(this.$store.state.stickersOpen) {this.$store.commit('toggleStickers', true)};

      //code to toggle selectEmoji modal
      this.selectingEmoji = !this.selectingEmoji
    },
    // Send a plain text message from the chatbar to the parent component
    sendMessage () {
      let md = require('markdown-it')().disable('heading')
      if (this.command) {
        this.$store.dispatch('dispatchCommand', {
          command: this.command,
          args: this.args
        })
        // TODO: move this to command function
        if (this.command.replace(/\W/g, '') === 'address') {
          this.handleNewMessage(this.$store.state.activeAccount, 'text')
        }
        this.messageText = ''
        this.command = false
        this.args = false
        this.resetSize()
        return
      }
      if (this.messageText.replace(/\s+/g, '').length >= 1) {
        if (this.messageText.length > this.limit) {
          return
        }
        this.$store.commit('chatWith', this.$store.state.activeChat)
        // Taking the this.messageText to render to Markdown if needed
        let currentMessage = md.renderInline(this.messageText)
        this.handleNewMessage(currentMessage, 'text')
        this.messageText = ''
        this.stopTyping()
        this.resetSize()
      }
    },
    startTyping () {
      if (!this.typing) {
        this.typing = true
        this.$WebRTC.send(this.$store.state.activeChat, {
          type: 'typing-notice',
          data: true
        })

        this.$store.dispatch('subscribeToSentbox')
      }
    },
    stopTyping () {
      this.typing = false
      this.$WebRTC.send(this.$store.state.activeChat, {
        type: 'typing-notice',
        data: false
      })
    },
    // eslint-disable-next-line
    isTyping: debounce(function (e) {
      this.stopTyping()
    }, 2000),
    // Select an emoji from the emoji picker and append it to our message
    selectEmoji (emoji) {
      this.messageText += emoji.native
      this.selectingEmoji = false
    },
    handleInputChange () {
      this.autoGrow()
      this.checkCommands()
    },
    checkCommands () {
      if (this.messageText[0] === '/') {
        const splitMessage = this.messageText.split(' ')
        const command = splitMessage[0]
        const args = splitMessage.slice(1, splitMessage.length)
        this.command = command
        this.args = args
      } else {
        this.command = false
        this.args = false
      }
    },
    autoGrow () {
      let messageBox = document.querySelector('.messageuser')
      let chatGroup = document.querySelector('.chat-group')

      messageBox.style.height = 'auto'
      if (messageBox.scrollHeight < 112) {
        messageBox.style.height = messageBox.scrollHeight + 2 + 'px'
        chatGroup.style.height = messageBox.scrollHeight + 40 + 'px'
      } else {
        messageBox.style.height = '112px'
        chatGroup.style.height = '152px'
      }
      messageBox.scrollTop = messageBox.scrollHeight
    },
    resetSize () {
      let messageBox = document.querySelector('.messageuser')
      let chatGroup = document.querySelector('.chat-group')
      messageBox.style.height = '2.5rem'
      chatGroup.style.height = '5rem'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./Chatbar.less"></style>
