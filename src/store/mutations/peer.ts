import IFriend from '../../interfaces/IFriend'
import { IState } from '../createState'

export default {
  // Update a peers status
  peerHealth (state: IState, data: any) {
    const [id, status] = data
    const friend = state.friends
      ? state.friends.filter((f: IFriend) => f.address === id)[0]
      : null
    if (friend) {
      if (friend.status === status) return // No Update Needed
      const withoutFriend = state.friends?.filter(f => f.address !== id) || []
      friend.status = status
      withoutFriend.push(friend)
      withoutFriend.sort((a: IFriend, b: IFriend) =>
        a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1
      )
      state.friends = withoutFriend
    }
  },
  // Update p2p handshake server status
  ICEConnected (state: IState, status: string) {
    state.p2pOnline = status
  },
  updateConnectedPeers (state: IState, { address, connected }) {
    state.connectedPeers = {
      ...state.connectedPeers,
      [address]: connected
    }
  }
}
