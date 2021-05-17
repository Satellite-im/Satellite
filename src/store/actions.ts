import friendsActions from './actions/friendsActions'
import web3Actions from './actions/web3Actions'
import stickersActions from './actions/stickersActions'
import threadActions from './actions/threadActions'
import mailboxActions from './actions/mailboxActions'
import p2pActions from './actions/p2pActions'
import databaseActions from './actions/databaseActions'
import commonActions from './actions/commonActions'
import walletActions from './actions/walletActions'
import commandActions from './actions/commandActions'
import serverActions from './actions/serverActions'

export default {
  ...friendsActions,
  ...web3Actions,
  ...stickersActions,
  ...threadActions,
  ...mailboxActions,
  ...p2pActions,
  ...databaseActions,
  ...walletActions,
  ...commandActions,
  ...serverActions,
  ...commonActions
}
