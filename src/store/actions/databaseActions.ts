import Database from '../../classes/database/Database'
import {
  LocalStorageConfig,
  TextileConfig
} from '../../classes/database/Interfaces'

export default {
  async initDatabase ({ commit, dispatch, state }) {
    // @ts-ignore
    const database: Database = this.$app.$database
    // @ts-ignore
    const RemoteStorage = this.$app.$RemoteStorage
    // @ts-ignore
    const ethereum = this.$app.$ethereum
    // @ts-ignore
    const v74pin = window.v74pin

    commit('starting', true)
    if (state.databaseEnabled) {
      const config: TextileConfig = {
        id: state.activeAccount,
        pass: v74pin,
        wallet: ethereum.wallet
      }

      await database.init('textile', config)
      commit('authenticated')

      // Init Remote Storage
      await RemoteStorage.init('remote-storage')
      await RemoteStorage.authorize()

      if (
        ethereum.isInitialized &&
        ethereum.wallet &&
        database.messageManager
      ) {
        // Initialize e2ee
        const { messageManager } = database
        messageManager.initE2EEngine(ethereum.wallet)
      }

      commit('starting', false)

      dispatch('initBuckets')
    } else {
      const config: LocalStorageConfig = {
        id: state.activeAccount,
        pass: v74pin
      }

      await database.init('localStorage', config)
      commit('authenticated')
      commit('starting', false)
    }
  },
  async initBuckets ({ commit }) {
    // @ts-ignore
    const database = this.$app.$database

    await database.initBuckets()
    commit('buckets')
  }
}
