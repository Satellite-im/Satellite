import createPersistedState from 'vuex-persistedstate'
import { defaultState } from './createState'

export const cookieStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: any) => {
    localStorage[key] = value
  },
  removeItem: (key: string) => delete localStorage[key]
}

interface IBlacklist {
  [key: string]: boolean
}

// Each state in this list will not be
// persisted
const blacklist: IBlacklist = {
  web3connected: true,
  injectedProvider: true,
  p2pOnline: true,
  dwellerAddress: true,
  activeCaller: true,
  starting: true,
  friends: true,
  connectedPeers: true,
  activeMediaStreamPeer: true,
  pendingMediaStream: true,
  typingUsers: true,
  accounts: true,
  balance: true,
  mnemonic: true,
  pin: true,
  availableStickers: true,
  ownedStickers: true,
  buckets: true,
  authenticated: true,
  criticalError: true,
  ICEConnected: true,
  activeCalls: true,
  incomingCall: true,
  messagesLimit: true
}

const persistedPaths = Object.keys(defaultState).filter(key => !blacklist[key])

export const persistedStateConfig = {
  key: '_vuex',
  filter ({ type }) {
    // Don't store route state in cookie
    return !type.startsWith('route/')
  },
  paths: persistedPaths,
  storage: cookieStorage
}

export default createPersistedState(persistedStateConfig)
