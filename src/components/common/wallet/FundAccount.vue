<template>
  <section class="fund-account-container">
    <p class="head">
      <strong>{{ $t('fund-account.heading') }}</strong>
    </p>
    <p class="fund-account-message" v-if="!funded">
      {{ $t('fund-account.fund-account-message') }}
      <br />
    </p>
    <p class="fund-account-message" v-else>
      {{ $t('fund-account.account-funded-message') }}
      <br />
    </p>
  </section>
</template>

<script>
import WalletAddressMini from '@/components/common/wallet/WalletAddressMini'
import Faucet from '@/utils/Faucet.ts'

export default {
  name: 'FundAccount',
  components: {
    WalletAddressMini
  },
  data () {
    return {
      activeAccount: this.$ethereum.activeAccount,
      funded: false
    }
  },
  methods: {
    async requestTokens (address) {
      const json = await Faucet.requestTokens(address)
      this.funded = true
    }
  },
  mounted () {
    this.requestTokens(this.activeAccount)
  }
}
</script>

<style scoped lang="less">
.fund-account-container {
  text-align: center;
  width: 100%;
  background: rgba(10, 10, 10, 0.86);
  padding: 50px;
  border-radius: 15px;

  .head {
    font-family: 'Space Mono', monospace;
    font-size: 20pt;
    padding-bottom: 1rem;
    text-transform: uppercase;
  }

  .input-container {
    padding: 2rem 0;
  }
}

@media (max-width: 768px) {
  .fund-account-container {
    width: 100%;
    margin: 0;
    margin-top: -4rem;
    background: transparent;
  }
}
</style>
