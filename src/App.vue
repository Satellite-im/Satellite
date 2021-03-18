<template>
  <div id="app" :class="{[this.$store.state.theme]: !['landing'].includes($route.name) || ! decrypted}">
    <div class="notification is-warning" v-if="showWarning">
      <button class="delete" v-on:click="hideWarning"></button>
      <span v-html="$t('alpha_release.warning')"></span>
    </div>
    <main id="main" class="theme" v-if="decrypted">
      <transition appear mode="out-in" name="slide-fade">
        <router-view></router-view>
      </transition>
    </main>
    <Unlock class="theme" v-else :decrypted="decrypt"/>
  </div>
</template>

<script>
import 'bulma/css/bulma.css';
import config from '@/config/config';
import Crypto from '@/classes/crypto/Crypto.ts';
import Unlock from '@/components/unlock/Unlock';

export default {
  name: 'app',
  components: {
    Unlock,
  },
  data() {
    return {
      decrypted: false,
      showWarning: !(localStorage.getItem('alpha-warning') === 'false'),
      friendsLoaded: false,
    };
  },
  methods: {
    decrypt() {
      this.decrypted = true;
      this.checkAccount();
    },
    hideWarning() {
      localStorage.setItem('alpha-warning', false);
      this.showWarning = false;
    },
    initP2P() {
      if (this.$store.state.friendsLoaded) {
        const crypto = new Crypto();
        // TODO: Move this to polling
        const addresses = this.$store.state.friends.map(f => f.address);
        this.$WebRTC.updateRegistry(addresses);

        // TODO: update this when active chats updates.

        this.$WebRTC.subscribe(() => {
          this.$store.commit('ICEConnected', true);
        }, ['connection-established']);
        // Watch for users typing
        this.$WebRTC.subscribe((event, identifier, message) => {
          this.$store.commit('userTyping', [identifier, message.data]);
        }, ['typing-notice'], this.$store.state.activeChats);

        // Track the health of a peer
        this.$WebRTC.subscribe((event, identifier) => {
          this.$store.commit('peerHealth', [identifier, 'alive']);
        }, ['heartbeat'], this.$store.state.activeChats);

        // Track the death of a peer
        this.$WebRTC.subscribe((event, identifier) => {
          this.$store.commit('peerHealth', [identifier, 'dead']);
        }, ['flatlined'], this.$store.state.activeChats);

        // Listen for keys
        this.$WebRTC.subscribe((event, identifier, message) => {
          crypto.storeKey(
            identifier,
            message.data,
          );
        }, ['key-offer'], this.$store.state.activeChats);

        // init
        this.$WebRTC.init(this.$ethereum.activeAccount);
        this.peerInit = true;
      }
    },
    checkAccount() {
      if (this.$store.state.activeAccount) {
        // Attach to peers
        this.initP2P();
        return;
      }
      setTimeout(this.checkAccount, config.peer.timeout);
    },
  },
  mounted() {
    this.$store.commit('starting', true);
    this.$store.commit('clearFriends');
    this.$store.commit('clear');
    // Reset media call data
    this.$store.commit('clearTypingUsers');
    // Connect when a new friend is added
    // we have active chats with.
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'addFriend') {
        // Connect to new peer.
        // TODO: Update WebRTC
        console.log('state', state);
      }

      // Use this workaround because vuex $store.watch is not
      // triggering any update
      // TODO: find the issue and use $store.wtach together with
      // getters instead
      if (!this.friendsLoaded && state.friendsLoaded) {
        this.initP2P();

        this.friendsLoaded = true;
      }
    });
    // Set i18n locale based on the user preferred language
    if (this.$store.state.settings.language) {
      this.$i18n.locale = this.$store.state.settings.language;
    }
  },
};
</script>

<style scoped lang="less">
.notification {
  position: absolute;
}


#app {
  height: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  overflow: hidden;
  // min-width: 990px;
}

#app .theme {
  position: relative;
  top: 0;
  bottom: 0;
  height: 100%;
}
</style>

<style lang="less" src="@/assets/styles/app.less"></style>
<style lang="less">
.dark {
  @import "assets/styles/true_dark.less";
}
.ice {
  @import "assets/styles/ice.less";
}
.tokyo {
  @import "assets/styles/tokyo.less";
}
.zenburn {
  @import "assets/styles/zenburn.less";
}
.notification {
  z-index: 10;
  margin: 1rem;
}
</style>
<style lang="less" src="@/assets/styles/media.less"></style>