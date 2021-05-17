import { BigNumber, utils } from 'ethers'
import { LangCodes } from '../utils/i18n'
import { AvailableProviders } from './mutations/web3'
// @ts-ignore
import MobileUtils from '@/utils/Mobile'
import config from '../config/config'

interface ISettings {
  darkMode: boolean
  language: LangCodes
}

type ThemeName = 'tokyo' | 'oled'

export interface IWalletAsset {
  symbol: string
  name: string
  icon: string
  contractAddress: string
  tokenType: 'default' | 'ERC20' | 'ERC721' | 'ERC1155' | 'dummy'
  balance?: BigNumber | number
  priceUsd?: number
  changePercent24Hr?: string
}

export interface IMessageLimit {
  limit: number
  skip: number
  end?: boolean
}

export interface IState {
  // Profile
  viewingProfile: string | boolean
  //
  command: string | boolean
  args: Array<string> | boolean
  pin: string | boolean
  starting: boolean
  authenticated: boolean
  buckets: boolean
  statusMsg: string
  // Settings
  settings: ISettings
  // Theme
  theme: ThemeName
  accent: string
  // Screen Share
  screenShareRequest: null
  captureMouse: 'always'
  // Audio
  audioQuality: number
  audioSamples: number
  noiseSuppression: boolean
  echoCancellation: boolean
  muted: boolean
  deafened: boolean
  // Video
  localVideo: boolean
  remoteVideo: boolean
  // Web3
  web3connected: boolean
  web3Stats: any
  accounts?: Array<any>
  gasPrice: number
  activeAccount?: string
  balance: number
  balanceLastUpdate?: number
  localAccount: boolean
  mnemonic: string
  // Wallet
  assets: { [key: string]: IWalletAsset }
  // Network
  availableProviders: Array<any>
  selectedProvider: any
  injectedProvider: any
  // Profile
  dwellerAddress?: string
  username: string
  profilePictureHash?: string
  files: Array<any>
  mainRoute: string
  // Friends
  friendsLoaded?: boolean
  friends?: Array<any>
  friendRequests?: Array<any>
  peerHealth: any
  unreads: Array<any>
  connectedPeers: { [key: string]: boolean }
  // Audio Video
  audioDevice: string
  videoDevice: string
  // Internal
  status: string
  p2pOnline: any
  sidebarOpen: boolean
  sidebarMobileOpen: boolean
  // Chat
  activeChats: Array<any>
  activeChat: any
  messages: Array<any>
  messagesLimit: IMessageLimit
  typingUsers: any
  userNotes: any
  showUser: boolean
  loadingMessages: boolean
  lastMessages: Object
  // Direct Calling Media Streams
  pendingMediaStream?: any
  activeMediaStreamPeer?: any
  incomingCall?: any
  activeCalls: Array<string>
  // Database
  databaseEnabled: boolean
  criticalError?: any
  // Servers
  servers: Array<any>
  channel?: any
  // Groups
  group?: any
  showGroupInfo: boolean
  // Stickers
  stickersOpen?: boolean
  stickerPack: any
  availableStickers?: any
  ownedStickers?: any
  showCreateGroup: boolean
}

export const defaultState: IState = {
  command: false,
  args: false,
  pin: false,
  starting: true,
  authenticated: false,
  buckets: false,
  statusMsg: 'Orbiting in space...',
  // Settings
  settings: {
    darkMode: true,
    language: 'en_US'
  },
  // Theme
  theme: MobileUtils.isMobile() ? 'oled' : 'tokyo',
  accent: 'blue',
  // Screen Share
  screenShareRequest: null,
  captureMouse: 'always',
  // Audio
  audioQuality: 96,
  audioSamples: 24,
  noiseSuppression: false,
  echoCancellation: false,
  muted: false,
  deafened: false,
  // Video
  localVideo: false,
  remoteVideo: false,
  // Web3
  web3connected: false,
  web3Stats: false,
  accounts: [],
  gasPrice: 36,
  activeAccount: undefined,
  balance: 0,
  localAccount: false,
  mnemonic: '',
  // Wallet
  assets: {
    default: {
      symbol: 'MATIC',
      name: 'Polygon',
      icon: 'QmV3z48ftfSLf1kHKEvFHjikiaA1GV88vRSSKFTmbBFgcn',
      contractAddress: 'default',
      tokenType: 'default',
      balance: 0,
      priceUsd: 0,
      changePercent24Hr: ''
    },
    '0x6A383cf1F8897585718DCA629a8f1471339abFe4': {
      symbol: 'DAI',
      name: 'Dai',
      icon: 'QmVChZZtAijsiTnMRFb6ziQLnRocXnBU2Lb3F67K2ZPHho',
      contractAddress: '0x6A383cf1F8897585718DCA629a8f1471339abFe4',
      tokenType: 'ERC20',
      balance: 0,
      priceUsd: 0,
      changePercent24Hr: ''
    },
    satellite: {
      symbol: 'SAT',
      name: 'Satellite',
      icon: 'QmUUtzqBLguzq1PHXSX91gkJbhp3WznaJpMpywiaCfmLXy',
      contractAddress: 'dummy',
      tokenType: 'dummy',
      balance: utils.parseEther('1538'),
      priceUsd: 1.3,
      changePercent24Hr: '5,8'
    }
  },
  // Network
  availableProviders: [AvailableProviders.SATELLITE],
  selectedProvider: null,
  injectedProvider: null,
  // Profile
  dwellerAddress: undefined,
  username: '',
  profilePictureHash: undefined,
  files: [],
  mainRoute: 'main',
  // Friends
  friends: [],
  friendsLoaded: false,
  friendRequests: [],
  peerHealth: {},
  unreads: [],
  connectedPeers: {},
  // Audio Video
  audioDevice: 'Default Microphone',
  videoDevice: 'Default Webcam',
  // Internal
  status: 'Alive',
  p2pOnline: false,
  sidebarOpen: true,
  sidebarMobileOpen: false,
  // Chat
  activeChats: [],
  activeChat: false,
  messages: [],
  messagesLimit: {
    limit: config.messaging.defaultLimit,
    skip: 0
  },
  typingUsers: {},
  userNotes: {},
  showUser: false,
  loadingMessages: false,
  lastMessages: {},
  // Direct Calling Media Streams
  pendingMediaStream: false,
  activeMediaStreamPeer: false,
  incomingCall: false,
  activeCalls: [],
  // Database
  databaseEnabled: true,
  criticalError: false,
  // Servers
  servers: [],
  channel: undefined,
  stickersOpen: false,
  stickerPack: undefined,
  availableStickers: {},
  ownedStickers: {},
  showCreateGroup: false,
  // Groups
  group: false,
  showGroupInfo: false,
  // Profile
  viewingProfile: false
}

const createState = (customState: any): IState =>
  Object.assign({}, defaultState, customState)

export default createState
