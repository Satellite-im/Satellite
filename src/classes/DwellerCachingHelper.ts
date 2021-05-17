import config from '../config/config'
import Registry from '../classes/contracts/Registry'
import DwellerContract from '../classes/contracts/DwellerContract'
import IDweller from '../interfaces/IDweller'

/**
 * Class representing a caching helper.
 * @class DwellerCachingHelper
 * @augments registryAddress Address to the on chain contract of the registry
 * @augments expiry how long should dwellers last in the cache
 */
export default class DwellerCachingHelper {
  expiry: number
  cache: any
  registryAddress: string
  ethereum: any
  /**
   * @constructs DwellerCachingHelper
   * @augments registryAddress Address to the on chain contract of the registry
   * @augments expiry how long should dwellers last in the cache
   */
  constructor (ethereum: any, registryAddress: string, expiry: number = 86000) {
    this.ethereum = ethereum
    this.expiry = expiry
    const localCache =
      localStorage.getItem(config.cache.dwellerCacheKey) || false
    this.cache = localCache ? JSON.parse(localCache) : {}
    this.registryAddress = registryAddress
  }

  /** @function
   * If the dweller exists in the cache and
   * is not expired, send it over to save time
   * @name getDwellerFromCache
   * @argument address Address of the dweller to fetch
   * @returns the dweller from the local cache, or false if there is no valid dweller
   */
  getDwellerFromCache (address: string) {
    const dweller = this.cache[address]
    if (!dweller) return false
    if (dweller.expiry < Date.now()) return false

    return dweller
  }

  /** @function
   * @name getDweller
   * @argument address Address of the dweller to fetch
   * @returns the dweller from the local cache, or on chain
   */
  async getDweller (address: string) {
    const dweller = this.getDwellerFromCache(address)

    if (dweller?.expiry > Date.now()) {
      return dweller
    }

    return this.updateDweller(address)
  }

  /** @function
   * @name updateDweller
   * Local method to update the cache with new info from the dweller
   * @argument address Address of the dweller to update
   * @returns the dweller from the chain
   */
  async updateDweller (address: string): Promise<IDweller | null> {
    // Create a registry contract instance
    const registry = new Registry(
      this.ethereum,
      config.registry[config.network.chain]
    )
    const dwellerContractAddress = await registry.getDwellerContract(address)

    if (dwellerContractAddress === '0x0000000000000000000000000000000000000000')
      return null

    const dwellerContract = new DwellerContract(
      this.ethereum,
      dwellerContractAddress
    )

    const dwellerData = await dwellerContract.getDweller()

    const {
      name_: dwellerName,
      photoHash_: dwellerPhoto,
      pubkey_: dwellerPubkey
    } = dwellerData.dweller

    // TODO: Update the contract to get the status within the same call
    const dwellerStatus = await dwellerContract.getStatus()

    const dweller = {
      name: dwellerName,
      photo: dwellerPhoto ? `${config.ipfs.browser}${dwellerPhoto}` : '',
      address,
      pubkey: dwellerPubkey,
      statusMsg: dwellerStatus,
      expiry: Date.now() + this.expiry
    }

    this.cache[address] = dweller
    this.updateCache()
    return dweller
  }

  /** @function
   * Update the localstorage cache for the entire list of dwellers
   * @name updateCache
   */
  updateCache () {
    localStorage.setItem(
      config.cache.dwellerCacheKey,
      JSON.stringify(this.cache)
    )
  }
}
