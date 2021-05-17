<template src="./EmbededProfile.html"></template>

<script>
import Mousetrap from 'mousetrap'
import VueQrcode from 'vue-qrcode'

import config from '@/config/config'
import DwellerContract from '@/classes/contracts/DwellerContract.ts'
import Badge from '@/components/common/Badge'
import DwellerCachingHelper from '@/classes/DwellerCachingHelper.ts'
import CircleIcon from '@/components/common/CircleIcon'
import PhotoCropper from 'vue-image-crop-upload'
import Registry from '@/classes/contracts/Registry.ts'
import ActionSelector from './editprofile/ActionSeletor'
import ChangePhoto from './editprofile/ChangePhoto'
import ChangeUsername from './editprofile/ChangeUsername'
import FilePinner from '@/classes/FilePinner.ts'

export default {
  name: 'EmbeddedProfile',
  props: ['customFinalAction', 'embeded', 'mountAction'],
  components: {
    VueQrcode,
    ActionSelector,
    ChangePhoto,
    ChangeUsername,
    CircleIcon,
    PhotoCropper,
    Badge
  },
  data () {
    return {
      qrColor: {
        dark: '#0f1015',
        light: '#b3bade'
      },
      profileFile: false,
      ipfsHash: false,
      error: false,
      created: false,
      transactionHash: false,
      confirmation: false,
      finished: false,
      dweller: false,
      onChainPhotoHash: false,
      actionsOpen: false,
      showChangePhoto: false,
      showChangeUsername: false,
      showCropper: false,
      config,
      funded: false,
      dwellerCachingHelper: new DwellerCachingHelper(
        this.$ethereum,
        config.registryAddress,
        config.cacher.dwellerLifespan
      )
    }
  },
  mounted () {
    this.mountAction()
    // Gets provider from window object
    this.getDwellerByAddress(this.$store.state.activeAccount)

    // Creates a registry instance
    this.registry = new Registry(
      this.$ethereum,
      config.registry[config.network.chain]
    )

    Mousetrap.bind('esc', () => {
      this.showCropper = false
    })
  },
  methods: {
    dataURItoBlob (dataURI) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      const byteString = atob(dataURI.split(',')[1])
      // separate out the mime component
      const mimeString = dataURI
        .split(',')[0]
        .split(':')[1]
        .split(';')[0]
      // write the bytes of the string to an ArrayBuffer
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i)
      }
      return new Blob([ab], { type: mimeString })
    },
    toggleCropper () {
      this.showCropper = !this.showCropper
    },
    hideActionSelector () {
      this.actionsOpen = false
    },
    hideChangePhoto () {
      this.showChangePhoto = false
    },
    hideChangeUsername () {
      this.showChangeUsername = false
    },
    cropSuccess (imgDataUrl) {
      const blob = this.dataURItoBlob(imgDataUrl)
      const resultFile = new File([blob], 'profile_pic', {
        type: blob.type
      })
      this.uploadProfilePic(resultFile)
      this.showCropper = false
    },
    changePhoto () {
      this.hideActionSelector()
      this.hideChangeUsername()
      this.showChangePhoto = true
    },
    changeUsername () {
      this.hideActionSelector()
      this.hideChangePhoto()
      this.showChangeUsername = true
    },
    async removePhoto () {
      this.ipfsHash = {
        path: ''
      }
      // const dwellerIDContract = await this.registry
      //   .getDwellerContract(this.$store.state.activeAccount);
      // DCUtils.setPhoto(
      //   dwellerIDContract,
      //   this.$store.state.activeAccount,
      //   this.ipfsHash,
      //   () => {
      //     this.$store.commit('setStatus', 'Transaction confirmed');
      //     this.$store.commit('profilePictureHash', this.ipfsHash.path);
      //   },
      // );
    },
    // Create a new profile via the Registry for this user
    async submitProfileContract () {
      if (this.$store.state.username.length < 5) {
        this.error = 'Your username needs to be at least 5 characters.'
        return
      }
      this.created = true

      this.registry.createDwellerId(
        this.$store.state.username,
        transactionHash => {
          this.transactionHash = transactionHash
        },
        receipt => {
          this.confirmation = receipt.confirmations
          this.finishProfile(receipt)
        }
      )
    },
    // When the file upload changes, we upload the profile picture to IPFS
    // for use in the dweller id card
    async uploadProfilePic (file) {
      this.profileFile = URL.createObjectURL(file)
      if (!file.type.includes('image')) {
        this.error = 'Please use an image for your profile picture.'
        return
      }
      this.error = false
      const ipfsResponse = await window.ipfs.add(file)
      this.ipfsHash = ipfsResponse
      let filePinner = new FilePinner(config.pinata.jwt)
      filePinner.PinByHash(this.ipfsHash.path)
    },
    // Set the dweller id profile picture hash on contract
    // after do any final tasks we need to do on chain
    async finishProfile (receipt) {
      if (!this.ipfsHash) {
        this.commitEverything(receipt)
        return
      }

      const dwellerContractAddress = await this.registry.getDwellerContract(
        this.$store.state.activeAccount
      )

      // const confirms = 0;
      this.$store.commit(
        'setStatus',
        'Transaction created, waiting for confirm'
      )

      const dwellerContractInstance = new DwellerContract(
        this.$ethereum,
        dwellerContractAddress
      )

      dwellerContractInstance.setPhoto(this.ipfsHash, txReceipt => {
        this.finished = true
        this.$store.commit('setStatus', 'Transaction confirmed')
        this.commitEverything(txReceipt)
      })
      // DCUtils.setPhoto(
      //   dwellerIDContract,
      //   this.$store.state.activeAccount,
      //   this.ipfsHash,
      //   () => {
      //     confirms += 1;
      //     this.finished = true;
      //     this.$store.commit('setStatus', 'Transaction confirmed');
      //     if (confirms >= 2 || !this.customFinalAction) {
      //       this.commitEverything(dwellerIDContract);
      //     }
      //   },
      // );
      // this.commitEverything(receipt);
    },
    // Note the changes to the profile locally in the store
    commitEverything (dwellerIDContract) {
      this.$store.commit('profilePictureHash', this.ipfsHash.path)
      this.$store.commit('dwellerAddress', dwellerIDContract)
      if (this.customFinalAction) this.customFinalAction()
    },
    // // Get a dweler from the registry
    // async getDweller() {
    //   this.$store.commit('setStatus', 'Fetching dweller from chain');
    //   DCUtils.getDweller(
    //     this.$store.state.dwellerAddress,
    //     (dweller, onChainPhotoHash) => {
    //       this.dweller = dweller;
    //       this.onChainPhotoHash = onChainPhotoHash;
    //     },
    //   );
    // },
    async getDwellerByAddress (address) {
      this.dweller = await this.dwellerCachingHelper.getDweller(address)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./EmbededProfile.less"></style>
