import { ethers } from 'ethers'
import { getInjectedProvider } from 'web3modal'
import Registry from '../../classes/contracts/Registry'
import DwellerID from '../../classes/contracts/DwellerContract'
import config from '../../config/config'

export default {
  // Checks if a provider has already been selected and connects to it
  async web3Start ({ dispatch, state }) {
    if (state.selectedProvider) {
      if (state.selectedProvider.type === 'injected') {
        dispatch('connectProvider', { providerInfo: state.selectedProvider })
      } else if (state.mnemonic) {
        const wallet = ethers.Wallet.fromMnemonic(state.mnemonic)
        dispatch('connectProvider', {
          providerInfo: { type: 'satellite' },
          wallet
        })
      }
    }
  },
  async detectInjected ({ commit }) {
    // Get injected provider using web3modal library
    const injectedProvider = getInjectedProvider()

    // Tell the store that we completed our check and we found
    // an injected web3 instance
    commit('setInjectedProvider', injectedProvider)
  },
  async selectProvider ({ commit, dispatch }, { provider }) {
    commit('setSelectedProvider', provider)

    if (provider.type === 'injected') {
      dispatch('connectProvider', { providerInfo: provider })
    }
  },
  async connectProvider ({ commit, dispatch }, { providerInfo, wallet }) {
    // Retrieve the ethereum provider from Vue app
    // @ts-ignore
    const ethereum = this.$app.$ethereum

    // Initialize the ethereum instance with the given provider
    await ethereum.initialize(providerInfo.type, wallet)

    // Update the state
    commit('setWeb3Connected', true)
    commit('accounts', ethereum.getAccounts())
    commit('defaultAccount')

    // Run the startup actions
    dispatch('startupActions')
    dispatch('getStats')
  },
  async startupActions ({ commit, state, dispatch }) {
    // @ts-ignore
    const ethereum = this.$app.$ethereum

    const registry = new Registry(
      ethereum,
      config.registry[config.network.chain]
    )
    const dwellerContract = await registry.getDwellerContract(
      ethereum.activeAccount
    )

    // Update the state with the dweller address fetched from the blockchain
    commit('dwellerAddress', dwellerContract)

    if (dwellerContract !== '0x0000000000000000000000000000000000000000') {
      const dwellerID = new DwellerID(ethereum, dwellerContract)
      const dwellerPhoto = await dwellerID.getPhoto()
      const dwellerName = await dwellerID.getDwellerName()

      // Update the state with user information
      commit('profilePictureHash', dwellerPhoto)
      commit('username', dwellerName)
    }
  },
  async getStats ({ commit }) {
    // @ts-ignore
    const ethereum = this.$app.$ethereum
    // Get stats
    const blockNumber = await ethereum.getBlockNumber()
    const nettype = await ethereum.getNetworkType()

    // Update the state with the retrieved stats
    commit('web3Stats', {
      blockNumber,
      nettype
    })
  }
}
