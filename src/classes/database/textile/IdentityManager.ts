import { Context } from '@textile/context'
import { Client, PrivateKey, Identity, Users } from '@textile/hub'

// @ts-ignore
import config from '@/config/config'
import { ethers, BigNumber } from 'ethers'
import { AuthData } from '../Interfaces'

export default class IdentityManager {
  private _identifier: string | null
  private _client: Client | null
  private _users: Users | null
  private _identity: Identity | null

  constructor () {
    this._identifier = null
    this._client = null
    this._users = null
    this._identity = null
  }

  // Getters
  get identifier () {
    return this._identifier
  }

  get client () {
    return this._client
  }

  get users () {
    return this._users
  }

  get identity () {
    return this._identity
  }

  // Methods
  private generateMessageForEntropy (address: string, secret: string): string {
    return (
      '******************************************************************************** \n' +
      'READ THIS MESSAGE CAREFULLY. \n' +
      'DO NOT SHARE THIS SIGNED MESSAGE WITH ANYONE OR THEY WILL HAVE READ AND WRITE \n' +
      'ACCESS TO THIS APPLICATION. \n' +
      'DO NOT SIGN THIS MESSAGE IF THE FOLLOWING IS NOT TRUE OR YOU DO NOT CONSENT \n' +
      'TO THE CURRENT APPLICATION HAVING ACCESS TO THE FOLLOWING APPLICATION. \n' +
      '******************************************************************************** \n' +
      'The Ethereum address used by this application is: \n' +
      '\n' +
      address +
      '\n' +
      '\n' +
      '\n' +
      'By signing this message, you authorize the current application to use the \n' +
      'following app associated with the above address: \n' +
      '\n' +
      'Satellie' +
      '\n' +
      '\n' +
      '\n' +
      'The hash of your non-recoverable, private, non-persisted password or secret \n' +
      'phrase is: \n' +
      '\n' +
      secret +
      '\n' +
      '\n' +
      '\n' +
      '******************************************************************************** \n' +
      'ONLY SIGN THIS MESSAGE IF YOU CONSENT TO THE CURRENT PAGE ACCESSING THE KEYS \n' +
      'ASSOCIATED WITH THE ABOVE ADDRESS AND APPLICATION. \n' +
      'AGAIN, DO NOT SHARE THIS SIGNED MESSAGE WITH ANYONE OR THEY WILL HAVE READ AND \n' +
      'WRITE ACCESS TO THIS APPLICATION. \n' +
      '******************************************************************************** \n'
    )
  }

  async fromWallet (wallet: ethers.Wallet) {
    const cached = await this.getIdentity(wallet.address)

    if (cached) {
      return cached
    }

    const secret = ethers.utils.solidityKeccak256(['string'], [''])
    const message = this.generateMessageForEntropy(wallet.address, secret)
    const signedText = await wallet.signMessage(message)
    const hash = ethers.utils.keccak256(signedText)

    if (hash === null) {
      throw new Error(
        'No account is provided. Please provide an account to this application.'
      )
    }
    // The following line converts the hash in hex to an array of 32 integers.
    // @ts-ignore
    const array = hash
      // @ts-ignore
      .replace('0x', '')
      // @ts-ignore
      .match(/.{2}/g)
      .map(hexNoPrefix => BigNumber.from('0x' + hexNoPrefix).toNumber())

    if (array.length !== 32) {
      throw new Error(
        'Hash of signature is not the correct size! Something went wrong!'
      )
    }
    const identity = PrivateKey.fromRawEd25519Seed(Uint8Array.from(array))
    this._identity = identity

    // Store the identity in LocalStorage
    this.storeIdentity(identity, wallet.address)

    // Your app can now use this identity for generating a user Mailbox, Threads, Buckets, etc
    return identity
  }

  async createRandom (): Promise<Identity> {
    /** No cached identity existed, so create a new one */
    const identity = await PrivateKey.fromRandom()
    this._identity = identity

    // Store the identity in LocalStorage
    this.storeIdentity(identity, 'generated')
    return identity
  }

  private storeIdentity (identity: Identity, identifier: string) {
    /** Add the string copy to the cache */
    // TODO: Encrypt this with user password in the future
    localStorage.setItem(`textile.identity.${identifier}`, identity.toString())
  }

  async getIdentity (identifier?: string): Promise<Identity | null> {
    /** Restore any cached user identity first */
    const cached = localStorage.getItem(
      `textile.identity.${identifier ? identifier : 'generated'}`
    )
    const identity = cached === null ? cached : PrivateKey.fromString(cached)
    this._identity = identity

    return identity
  }

  async authorize (identity: Identity): Promise<AuthData> {
    const context = new Context(config.textile.localURI)
    const client =
      config.env === 'dev'
        ? new Client(context)
        : await Client.withKeyInfo({
            key: config.textile.key
          })

    const users = await Users.withKeyInfo({
      key: config.textile.key
    })

    await users.getToken(identity)

    const token = await client.getToken(identity).catch(e => {
      throw new Error("Couldn't connect to Textile.io")
    })

    return {
      client,
      token,
      users
    }
  }
}
