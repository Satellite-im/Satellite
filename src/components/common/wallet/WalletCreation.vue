<template>
  <div class="fullscreen-pane">
    <section class="wallet-creation-container" v-if="step === 'initial'">
      <div class="main-area">
        <h1 class="head">
          {{ $t(`web3.wallet_creation.step.${step}.heading`) }}
        </h1>

        <img src="/static/img/big_img/account.png" alt="" class="account-img" />

        <b>
          {{ $t(`web3.wallet_creation.step.${step}.subtext`) }}
        </b>
      </div>

      <div class="buttons-container">
        <button
          class="button is-primary centered create-wallet-btn"
          v-on:click="goToStep('import')"
        >
          {{ $t(`web3.wallet_creation.step.${step}.secondary_cta`) }}
        </button>
        <button
          class="button is-primary centered create-wallet-btn"
          v-on:click="createWallet()"
        >
          {{ $t(`web3.wallet_creation.step.${step}.primary_cta`) }}
        </button>
      </div>
    </section>

    <section class="wallet-creation-container" v-if="step === 'import'">
      <div class="main-area">
        <h1 class="head">
          {{ $t(`web3.wallet_creation.step.${step}.heading`) }}
        </h1>

        <!-- <img src="/static/img/big_img/account.png" alt="" class="account-img" /> -->

        <b>
          {{ $t(`web3.wallet_creation.step.${step}.subtext`) }}
        </b>

        <div class="recovery-phrase-container">
          <div class="qr-modal" v-if="showScanQR">
            <QRScan :close="toggleScanQR" :handler="onQRScan" />
          </div>

          <textarea class="textarea" v-model="recoveryPhrase"></textarea>
          <button
            class="is-button button is-primary is-small"
            v-on:click="toggleScanQR"
          >
            <i class="fas fa-qrcode"></i> &nbsp; {{ $t('wallet.scan') }}
          </button>
        </div>
      </div>

      <div class="buttons-container">
        <button
          class="button is-primary centered create-wallet-btn"
          v-on:click="goToStep('initial')"
        >
          {{ $t(`web3.wallet_creation.step.${step}.secondary_cta`) }}
        </button>
        <button
          class="button is-primary centered create-wallet-btn"
          v-on:click="recover()"
          :disabled="recoveryPhrase.split(' ').length !== 12"
        >
          {{ $t(`web3.wallet_creation.step.${step}.primary_cta`) }}
        </button>
      </div>
    </section>

    <section class="wallet-creation-container" v-if="step === 'generate'">
      <div class="main-area">
        <h1 class="head">
          {{ $t(`web3.wallet_creation.step.${step}.heading`) }}
        </h1>

        <img src="/static/img/big_img/account.png" alt="" class="account-img" />

        <b>
          {{ $t(`web3.wallet_creation.step.${step}.subtext`) }}
        </b>
      </div>

      <div class="buttons-container">
        <button
          class="button is-primary centered create-wallet-btn"
          v-on:click="goToStep('initial')"
        >
          {{ $t(`web3.wallet_creation.step.${step}.secondary_cta`) }}
        </button>
        <button
          class="button is-primary centered create-wallet-btn"
          v-on:click="createWallet()"
        >
          {{ $t(`web3.wallet_creation.step.${step}.primary_cta`) }}
        </button>
      </div>
    </section>
    <section class="wallet-creation-container" v-if="step === 'showseed'">
      <div class="main-area">
        <h1 class="head">
          {{ $t(`web3.wallet_creation.step.${step}.heading`) }}
        </h1>
        <b>
          {{ $t(`web3.wallet_creation.step.${step}.subtext`) }}
        </b>

        <div class="mnemonic-container">
          <span
            v-for="(word, index) in this.splittedMnemonic"
            v-bind:key="index"
            class="mnemonic-word"
          >
            <span class="number">{{ `${index + 1}.` }}</span
            >{{ word }}
          </span>
        </div>
      </div>

      <div class="buttons-container">
        <!-- Switch v-on:click to goToStep('seedcheck') to re-enable seed check -->
        <button class="button is-primary big-btn" v-on:click="walletCreated()">
          {{ $t(`web3.wallet_creation.step.${step}.primary_cta`) }}
        </button>
      </div>
    </section>
    <section class="wallet-creation-container" v-if="step === 'seedcheck'">
      <div class="main-area">
        <h1 class="head">
          {{ $t(`web3.wallet_creation.step.${step}.heading`) }}
        </h1>
        <b>
          {{ $t(`web3.wallet_creation.step.${step}.subtext`) }}
        </b>

        <div class="mnemonic-container">
          <div
            v-for="(word, index) in this.splittedMnemonic"
            v-bind:key="index"
            class="mnemonic-word"
          >
            <span v-if="wordsToCheck.indexOf(index) === -1">
              <span class="number">{{ `${index + 1}.` }}</span
              >{{ word }}
            </span>
            <span v-else>
              <span class="number">{{ `${index + 1}.` }}</span>
              <input v-model="input[index]" />
            </span>
          </div>
        </div>
      </div>

      <div class="buttons-container">
        <button
          class="button is-primary big-btn-higher"
          v-on:click="goToStep('showseed')"
        >
          {{ $t(`web3.wallet_creation.step.${step}.secondary_cta`) }}
        </button>

        <button
          :disabled="!checkWords()"
          class="button is-primary big-btn"
          v-on:click="walletCreated()"
        >
          {{ $t(`web3.wallet_creation.step.${step}.primary_cta`) }}
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import { ethers } from 'ethers'
import Crypto from '@/utils/Crypto.ts'
import QRScan from '@/components/common/QRScan'

export default {
  name: 'WalletCreation',
  components: {
    QRScan
  },
  data () {
    return {
      step: 'initial',
      wallet: null,
      splittedMnemonic: [],
      wordsToCheck: [],
      input: {},
      recoveryPhrase: '',
      showScanQR: false
    }
  },
  methods: {
    goToStep (step) {
      this.step = step
    },
    createWallet () {
      this.wallet = ethers.Wallet.createRandom()
      this.splittedMnemonic = this.wallet.mnemonic.phrase.split(' ')

      const numbers = [...Array(12).keys()]

      // Shuffle array
      const shuffled = numbers.sort(() => 0.5 - Math.random())

      // Get sub-array of first n elements after shuffled
      this.wordsToCheck = shuffled.slice(0, 4)

      this.goToStep('showseed')
    },
    checkWords () {
      const areWordsRight = this.wordsToCheck.reduce((acc, next) => {
        return (
          acc &&
          this.input[next] &&
          this.input[next].toLowerCase().trim() === this.splittedMnemonic[next]
        )
      }, true)

      return areWordsRight
    },
    async walletCreated () {
      this.$store.commit('setMnemonic', this.wallet.mnemonic.phrase)
      const encrypted = await Crypto.encrypt(
        this.wallet.mnemonic.phrase,
        this.$store.state.pin
      )
      localStorage.setItem('mnemonic', encrypted)
      this.onWalletCreated(this.wallet)
    },
    recover () {
      this.wallet = ethers.Wallet.fromMnemonic(this.recoveryPhrase)

      this.walletCreated()
    },
    onQRScan (code) {
      const mnemonic = code && code.split(' ')

      if (mnemonic.length === 12) {
        this.recoveryPhrase = code
        this.toggleScanQR()
      } else {
        console.error('Invalid Recovery phrase')
      }
    },
    toggleScanQR () {
      this.showScanQR = !this.showScanQR
    }
  },
  mounted () {},
  props: ['onWalletCreated']
}
</script>

<style scoped lang="less">
.big-btn {
  height: 50px;
  float: right;
  margin: 0 auto;
  display: block;
  width: 100%;
}
.big-btn-higher {
  height: 50px;
  position: fixed;
  bottom: calc(3rem + 50px);
}
.account-img {
  display: none;
}
.mnemonic-word {
  position: relative;
  padding-left: 1rem;
  text-align: center;
  font-size: 14pt;
  padding: 0.5rem !important;
  border-radius: 2px !important;

  .number {
    position: absolute;
    top: 0;
    left: 0;
    width: 22px;
    font-size: 10pt;
    border-radius: 3px;
  }
}
.wallet-creation-container {
  text-align: center;
  width: 100%;
  background: rgba(10, 10, 10, 0.86);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .main-area {
    width: 50%;
    padding: 20% 50px 0 50px;

    .head {
      font-family: 'Space Mono', monospace;
      font-size: 20pt;
      text-transform: uppercase;
      padding-bottom: 1rem;
    }

    button {
      margin-top: 2rem;
    }

    .mnemonic-container {
      display: grid;
      grid-template-columns: repeat(4, 2fr);
      column-gap: 4px;
      row-gap: 4px;

      .mnemonic-word {
        padding: 4px;
        background-color: #545974;
        border-radius: 4px;
        color: #fff;
        max-width: 100%;
      }

      input {
        width: 100%;
        background-color: transparent !important;
        text-align: center;
        color: #fff !important;
        font-size: 13pt;
        font-weight: bold;
      }

      margin: 10px 0;
    }
  }

  .buttons-container {
    width: 50%;
    padding: 0 50px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .big-btn {
    height: 50px;
    position: fixed;
    bottom: 2rem;
    float: unset;
    margin: unset;
    display: unset;
    width: unset;
  }
  .create-wallet-btn {
    height: 35px;
    padding: 5px;
  }

  .account-img {
    display: inline-block;
    width: 90%;
    margin: 0 auto;
    margin-bottom: 2rem;
    margin-top: 1rem;
  }
  .wallet-creation-container {
    width: 100%;
    margin: 0;
    background: transparent;
    height: 100%;

    .main-area {
      width: 100%;
      flex: 1;
      padding: 15px;

      .recovery-phrase-container {
        margin-top: 50px;
      }
    }

    .buttons-container {
      height: 150px;
      width: 100%;
      justify-content: space-between !important;
      flex-direction: column;
      align-items: center;
      padding: 0 0 30px 0;

      button {
        width: 80%;
      }
    }
  }

  .mnemonic-container {
    grid-template-columns: repeat(2, 2fr) !important;
    width: 100%;
    margin-top: 2rem !important;
  }

  .mnemonic-word {
    position: relative;
    padding-left: 1rem;
    text-align: center;
    font-size: 14pt;
    padding: 0.5rem !important;
    border-radius: 2px !important;

    .number {
      position: absolute;
      top: 0;
      left: 0;
      width: 22px;
      font-size: 10pt;
      border-radius: 3px;
    }
  }

  .fullscreen-pane {
    // background-image: url(/static/img/mobile-background.png);
    background-position: bottom;
    background-size: contain;
    background-repeat: no-repeat;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
