import P2PUser, { CallEvent } from './P2PUser'
import config from '../../config/config'

interface Subscriber {
  method: CallableFunction
  events: string[]
  identifiers: string[] // Listen to only specific peers
}

interface Message {
  type: string
  data: any
}

type RTCEvent =
  | 'signal'
  | 'connect'
  | 'message'
  | 'incoming-call'
  | 'outgoing-call'
  | 'typing-notice'
  | 'data'
  | 'disconnect'

export default class WebRTC {
  public protocol: string
  protected _identifier: string
  protected _subscribers: Subscriber[]
  public connectedPeers: { [key: string]: P2PUser }
  protected _peersData: { [key: string]: any }
  protected _peers: { [key: string]: any }
  protected _isHandshaking: boolean
  protected _announceURLs: Array<string> = config.peer.announceURLs

  /** @constructor
   * Construct a new Peer 2 Peer handler
   * @argument identifier the ID we'd like to use for handshakes
   */
  constructor () {
    this.protocol = 'peerjs <https://peerjs.com/>'
    this._identifier = ''
    this._subscribers = []
    this.connectedPeers = {}
    this._peersData = {}
    this._peers = {}
    this._isHandshaking = false
  }

  /** @method
   * Build a standardized identifier for peer connections
   * @name buildIdentifier
   * @argument identifier string identifier, usually an Ethereum address.
   * @returns returns standardized identifier
   */
  public buildIdentifier (identifier: string): string {
    return identifier.replace('0x', 'WRTCx')
  }

  /** @method
   * Revert an identifier back to the original input useful for subscriptions being clear
   * @name revertIdentifier
   * @argument identifier string identifier, usually an Ethereum address.
   * @returns returns reverted non-standard identifier
   */
  public revertIdentifier (identifier: string): string {
    return identifier.replace('WRTCx', '0x')
  }

  /** @method
   * Get a list of current subscribers
   * @name subscribers
   * @returns array of Subscribers
   */
  get subscribers (): Subscriber[] {
    return this._subscribers
  }

  /**
   * @method setAnnounceURLs
   * @description Allow to specify different WebTorrent announce URLs for the signaling
   * @param announceURLs list of announce urls
   */
  setAnnounceURLs (announceURLs: Array<string>) {
    this._announceURLs = announceURLs
  }

  /** @method
   * Check if a peer by ID is online
   * @name isConnected
   * @argument identifier string identifier, usually an Ethereum address.
   * @returns returns if the peer is online or not, represented by a boolean
   */
  public isConnected (identifier: string): boolean {
    const id = identifier.startsWith('WRTCx')
      ? identifier
      : this.buildIdentifier(identifier)
    return Boolean(this.connectedPeers[identifier])
  }

  /** @method
   * Find a peer by identifier
   * @name find
   * @argument identifier string identifier, usually an Ethereum address.
   * @returns returns either a peer, or undefined if not found
   */
  public find (identifier: string): P2PUser | undefined {
    return this._identifier[identifier]
  }

  /**
   * @function addPeer
   * @param address Ethereum address of the recipient
   * @param secret The secret that will be used as peer identifier
   * @returns a P2PUser instance
   */
  addPeer (address: string, secret: string): P2PUser {
    const identifier = this.buildIdentifier(address)

    const listeners = {
      onConnect: () => {
        this.onConnect(identifier)
      },
      onError: error => {
        // console.error(`Failed to connect ${identifier}`, error)
      },
      onData: data => {
        this.onPeerData(identifier, data)
      },
      onClose: () => {
        this.onDisconnect(identifier)
      },
      onCall: () => {
        this.emit('incoming-call', identifier, {})
      }
    }

    const peer = new P2PUser(identifier, secret, this._announceURLs, listeners)

    peer.subscribeToCallEvents((event: CallEvent, ...args: any) => {
      this.emit(event, identifier, {
        type: event,
        data: args
      })
    })

    this._peers[identifier] = peer

    return peer
  }

  /**
   * @function isPeerConnected
   * @description Checks if a given peer is connected
   * @param address Ethereum address of the peer to check
   * @returns true | false
   */
  isPeerConnected (address: string): Boolean {
    const identifier = this.buildIdentifier(address)
    return Boolean(this.connectedPeers[identifier])
  }

  /**
   * @function isPeerAlreadyCreated
   * @description Checks if a given peer has been already created and
   * connected to the tracker url
   * @param address Ethereum address of the peer to check
   * @returns true | false
   */
  isPeerAlreadyCreated (address: string): Boolean {
    const identifier = this.buildIdentifier(address)
    return Boolean(this._peers[identifier])
  }

  /**
   * @function connect
   * @description Initiates a peer and tries to connect
   * @param address Ethereum address to connect
   * @param initiator Boolean value if the peer must be an initiator or not
   * @param secret The shared secret used for the connection with a specific peer
   */
  initiateConnection (address: string, secret: string) {
    if (this.isPeerConnected(address)) {
      console.warn(`Already connected to ${address}`)
      return
    }

    if (this.isPeerAlreadyCreated(address)) {
      console.warn(
        `The peer for ${address} has already been created. Waiting for connection`
      )
      return
    }

    this.addPeer(address, secret)
  }

  /**
   * @funciton onPeerData
   * @description Callback fired whenever a peer receives data
   * @param identifier Identifier of the peer that sent data
   * @param data Data that has been received from peer
   */
  onPeerData (identifier: string, data: any) {
    this.publish(data.type, identifier, {
      type: data.type,
      data: data.data
    })
  }

  /**
   * @funciton onConnect
   * @description Callback fired whenever a peer connects to another one
   * @param identifier Identifier of the peer that has connected
   */
  onConnect (identifier: string) {
    const peer = this._peers[identifier]
    this.connectedPeers[identifier] = peer
    delete this._peers[identifier]

    this.publish('connect', identifier, {
      type: 'connect',
      data: { identifier: this.revertIdentifier(identifier) }
    })
  }

  /**
   * @funciton onDisconnect
   * @description Callback fired whenever a peer disconects
   * @param identifier Identifier of the peer that has disconnected
   */
  onDisconnect (identifier: string) {
    delete this.connectedPeers[identifier]

    console.log('disconnect', identifier, this.connectedPeers)
    this.emit('disconnect', identifier, {})
  }

  /**
   * @function emit
   * @description Emits a specific event to subscriber
   * @param event Event name
   * @param peerId id of the peer (identifier)
   * @param data data emitted by the event
   */
  emit (event: RTCEvent | CallEvent, peerId: string, data: any) {
    this.subscribers.map(subscriber => {
      const events = subscriber.events
      // Ensure the subscriber is listening for the event
      if (events.includes(event) || events.includes('*')) {
        subscriber.method(event, this.revertIdentifier(peerId), data)
      }
    })
  }

  /**
   * @function subscribe
   * @description Subscribe to multiple events
   * @param method Callback function
   * @param events events to
   * @param identifiers Listen only to events coming from this identifier
   * @returns listener id
   */
  public subscribe (
    method: CallableFunction,
    events: string[],
    identifiers: string[]
  ): number {
    const id = this.subscribers.length
    this.subscribers.push({
      method,
      events,
      identifiers
    })
    return id
  }

  /**
   * @function unSubscribe
   * @description Removes a listener
   * @param index index of the listener to remove (listener id)
   * @returns Error or null
   */
  public unSubscribe (index: number): Error | null {
    if (index > this.subscribers.length) return new Error('Index out of bounds')
    this.subscribers.splice(index, 1)
    return null
  }

  /**
   * @function publish
   * @description Emit an event
   * @param event event name to emit
   * @param identifier identifier of the peer the event is related to
   * @param message event information
   */
  private publish (event: string, identifier: string, message: Message): void {
    this.subscribers.map(subscriber => {
      const events = subscriber.events
      const normalizedIdentifiers = subscriber.identifiers
        ? subscriber.identifiers.map(id => {
            return this.buildIdentifier(id)
          })
        : null
      // Ensure the subscriber is listening for the event
      if (events.includes(event) || events.includes('*')) {
        // Chec if the subscriber is only interested in specific users
        if (normalizedIdentifiers?.includes(identifier)) {
          subscriber.method(event, this.revertIdentifier(identifier), message)
          // They arn't listenting to any specific users
        } else if (!normalizedIdentifiers) {
          subscriber.method(event, this.revertIdentifier(identifier), message)
        }
      }
    })
  }

  /**
   * @function send
   * @description Sends data through p2p connection
   * @param address Address of the recipient
   * @param data data to send
   */
  public send (address: string, data: any) {
    if (this.isPeerConnected(address)) {
      const identifier = this.buildIdentifier(address)
      const peer = this.connectedPeers[identifier]

      peer.send(JSON.stringify(data))
    }
  }

  /**
   * @function call
   * @description Allow users to call a specific address
   * @param address Ethereum address of the receipient
   * @param stream Media Stream
   */
  public async call (address: string, stream: MediaStream) {
    const identifier = this.buildIdentifier(address)
    if (!this.isConnected(identifier)) {
      console.warn('[Method: call] Peer not connected')
      return
    }

    const peer = this.connectedPeers[identifier]

    peer.call(stream)

    this.emit('outgoing-call', identifier, {
      type: 'outgoing-call',
      data: {}
    })
  }

  public async addStream (address: string, stream: MediaStream) {
    const identifier = this.buildIdentifier(address)
    const peer = this.connectedPeers[identifier]
    peer.addStream(stream)
  }

  public async removeStream (address: string, stream: MediaStream) {
    const identifier = this.buildIdentifier(address)
    const peer = this.connectedPeers[identifier]
    peer.removeStream(stream)
  }

  public async addTrack (address: string, stream: MediaStream, track) {
    const identifier = this.buildIdentifier(address)
    const peer = this.connectedPeers[identifier]
    peer.addTrack(track, stream)
  }

  public async removeTrack (address: string, stream: MediaStream, track) {
    const identifier = this.buildIdentifier(address)
    const peer = this.connectedPeers[identifier]
    peer.removeTrack(track, stream)
  }

  public async replaceTrack (
    address: string,
    stream: MediaStream,
    oldTrack,
    newTrack
  ) {
    const identifier = this.buildIdentifier(address)
    const peer = this.connectedPeers[identifier]
    peer.replaceTrack(oldTrack, newTrack, stream)
  }

  public streamUpdate (address, videoEnabled) {
    const identifier = this.buildIdentifier(address)
    const peer = this.connectedPeers[identifier]
    peer.send(JSON.stringify({ type: 'stream-update', data: videoEnabled }))
  }

  /**
   * @function answerCall
   * @description Allow users to answer a call
   * @param address Ethereum address of the sender
   * @param stream Media Stream
   */
  public async answerCall (address: string, stream: MediaStream) {
    const identifier = this.buildIdentifier(address)
    if (!this.isConnected(identifier)) {
      console.warn('[Method: answerCall] Peer not connected')
      return
    }

    const peer = this.connectedPeers[identifier]

    // Answer the call and send the information to the peer
    peer.answerCall(stream, true)
  }

  /**
   * @function hangupCall
   * @description Terminate the active call
   * @param address Address of the recipient
   */
  public async hangupCall (address: string) {
    const identifier = this.buildIdentifier(address)

    if (!this.isConnected(identifier)) {
      console.warn('[Method: hangupCall] Peer not connected')
      return
    }

    const peer = this.connectedPeers[identifier]

    // Hangup the call and send the information to the connected peer
    peer.hangupCall(true)
  }

  /**
   * @method getActiveCalls
   * @description Returns a list of active calls
   * @returns a list of active calls
   */
  public getActiveCalls () {
    return Object.entries(this.connectedPeers).filter(
      entry => entry?.[1]?.activeCall
    )
  }
}
