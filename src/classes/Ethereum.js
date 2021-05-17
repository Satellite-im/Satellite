/* global localStorage */

import { ethers } from 'ethers'
import config from '@/config/config'
import { getEthereumProviderByNetwork } from '@/utils/EthereumProvider'

export default class Ethereum {
  constructor () {
    this.initialized = false
    this.utils = ethers.utils
    this.readinessPromise = new Promise(resolve => {
      this.loadingComplete = resolve
    })
  }

  /**
   * @description Initializes the provider based on the provider type
   */
  async initialize (providerType, wallet = null, networkRpc = null) {
    this.netConfig = config.network
    this.providerType = providerType

    if (this.providerType === 'injected') {
      this.accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      this.provider = new ethers.providers.Web3Provider(window.ethereum)

      // If no accounts passed by the constructor, use web3 api to get them
      this.signer = this.provider.getSigner(0)
      // this.accounts = await this.provider.listAccounts();
      this.activeAccount = this.accounts[0]

      // Activate listeners
      this.onAccountChange = window.ethereum.on(
        'accountsChanged',
        this.handleAccountChange
      )
      this.onNetworkChange = window.ethereum.on(
        'networkChanged',
        this.handleNetworkChange
      )

      this.initialized = true
    } else if (this.providerType === 'satellite' && wallet) {
      // If no network rpc url is provided, the app will automatically connect to
      // goerli testnet
      if (!networkRpc) {
        this.provider = getEthereumProviderByNetwork(config.network.chain)
      } else {
        this.provider = new ethers.providers.JsonRpcProvider(networkRpc)
      }

      this.wallet = wallet

      this.signer = wallet.connect(this.provider)

      this.accounts = [this.signer.address]

      this.activeAccount = this.signer.address

      this.initialized = true
    } else {
      console.error('Signer is required for satellite provider')
    }
  }

  /**
   * @description Utility function to check if the provider has
   * been initialized
   */
  isInitialized () {
    return this.initialized
  }

  /**
   * @description Account change callback
   * @param {string[]} accounts
   */
  handleAccountChange (accounts) {
    this.accounts = accounts
    this.activeAccount = this.selectedAddress
  }

  /**
   * @description Network change callback
   * @param {string} networkId
   */
  handleNetworkChange (networkId) {
    this.selectedNetwork = networkId
  }

  /**
   * @description Retrieve the current block number from the network
   */
  async getBlockNumber () {
    return this.provider.getBlockNumber()
  }

  /**
   * @description Retrieve the network from the network
   */
  async getNetworkType () {
    return this.provider.getNetwork()
  }

  /** @function
   * Check for user specified provider in storage, else use defaults
   * @name fetchProvider
   */
  fetchProvider () {
    return (
      this.netConfig.eth[localStorage.getItem('Satellite.provider')] ||
      this.netConfig.eth.default
    )
  }

  /** @function
   * Send ether to another address
   * @name sendEther
   * @argument to address to send ether to
   * @argument from address to send from (must have access)
   * @argument value amount (in Ether) to send
   * @argument cb callback function to send tx hash to
   */
  sendEther (to, value, cb) {
    const transaction = {
      to,
      value: ethers.utils.parseEther(value)
    }

    this.signer.sendTransaction(transaction).then(tx => cb(tx.hash))
  }

  /** @function
   * Get the contract constructor
   * @name getContract
   * @argument abi abstract interface for the contract
   * @argument address address of the contract on chain
   */
  getContract (abi, address = null) {
    if (!this.initialized) {
      console.warn('Ethereum instance has not been initialized')
    }
    return new ethers.Contract(address, abi, this.signer)
  }

  /**
   * @name getAccounts
   * @returns the list of available accounts
   */
  getAccounts () {
    return this.accounts
  }

  /**
   * @name getActiveAccount
   * @returns the address of the active account
   */
  getActiveAccount () {
    return this.activeAccount
  }

  /**
   * @name getCurrentAccountBalance
   * @returns The balance of the active account
   */
  getCurrentAccountBalance () {
    if (this.activeAccount) {
      return this.provider.getBalance(this.activeAccount)
    }
    return null
  }

  /**
   * @name isAddress
   * @param {string} text
   * @returns a boolean value that indicates if the given string is an address or not
   */
  isAddress (text) {
    return this.utils.isAddress(text)
  }

  /**
   * @name getSharablePublicKey
   * @returns Get the public key in a format that can be verified by the contract
   */
  getSharablePublicKey () {
    return `0x${this.wallet.publicKey.slice(4)}`
  }
}
