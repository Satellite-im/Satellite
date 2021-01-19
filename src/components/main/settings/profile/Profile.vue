<template src="./Profile.html"></template>

<script>
import Mousetrap from 'mousetrap';

import config from '@/config/config';
import DCUtils from '@/utils/contracts/DwellerContract.ts';
import Badge from '@/components/common/Badge';
import Ethereum from '@/classes/Ethereum';
import DwellerCachingHelper from '@/classes/DwellerCachingHelper.ts';
import CircleIcon from '@/components/common/CircleIcon';
import PhotoCropper from 'vue-image-crop-upload';
import Vault74Registry from '@/utils/contracts/Vault74Registry.ts';
import ActionSelector from './editprofile/ActionSeletor';
import ChangePhoto from './editprofile/ChangePhoto';
import ChangeUsername from './editprofile/ChangeUsername';


const ethereum = new Ethereum('user-provided');

export default {
  name: 'Profile',
  props: ['customFinalAction', 'embeded'],
  components: {
    ActionSelector,
    ChangePhoto,
    ChangeUsername,
    CircleIcon,
    PhotoCropper,
    Badge,
  },
  data() {
    return {
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
        config.registryAddress,
        config.cacher.dwellerLifespan,
      ),
    };
  },
  mounted() {
    this.getDwellerByAddress(this.$store.state.activeAccount);
    Vault74Registry.getDwellerContract(this.$store.state.activeAccount);
    Mousetrap.bind('esc', () => {
      this.showCropper = false;
    });
    if (ethereum.localAccount) {
      const pollBalance = () => {
        ethereum.eth.getBalance(this.$store.state.activeAccount).then((bal) => {
          if (bal > 0) {
            this.funded = true;
          } else {
            setTimeout(() => {
              pollBalance();
            }, 500);
          }
        });
      };
      pollBalance();
    }
  },
  methods: {
    dataURItoBlob(dataURI) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      const byteString = atob(dataURI.split(',')[1]);
      // separate out the mime component
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      // write the bytes of the string to an ArrayBuffer
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    },
    toggleCropper() {
      this.showCropper = !this.showCropper;
    },
    hideActionSelector() {
      this.actionsOpen = false;
    },
    hideChangePhoto() {
      this.showChangePhoto = false;
    },
    hideChangeUsername() {
      this.showChangeUsername = false;
    },
    cropSuccess(imgDataUrl) {
      const blob = this.dataURItoBlob(imgDataUrl);
      const resultFile = new File(
        [blob],
        'profile_pic',
        {
          type: blob.type,
        },
      );
      this.uploadProfilePic(resultFile);
      this.showCropper = false;
    },
    changePhoto() {
      this.hideActionSelector();
      this.hideChangeUsername();
      this.showChangePhoto = true;
    },
    changeUsername() {
      this.hideActionSelector();
      this.hideChangePhoto();
      this.showChangeUsername = true;
    },
    async removePhoto() {
      this.ipfsHash = {
        path: '',
      };
      const dwellerIDContract = await Vault74Registry
        .getDwellerContract(this.$store.state.activeAccount);
      DCUtils.setPhoto(
        dwellerIDContract,
        this.$store.state.activeAccount,
        this.ipfsHash,
        () => {
          this.$store.commit('setStatus', 'Transaction confirmed');
          this.$store.commit('profilePictureHash', this.ipfsHash.path);
        },
      );
    },
    // Create a new profile via the Vault74Registry for this user
    async submitProfileContract() {
      if (this.$store.state.username.length < 5) {
        this.error = 'Your username needs to be at least 5 characters.';
        return;
      }
      this.created = true;
      Vault74Registry.createDwellerId(
        this.$store.state.username,
        this.$store.state.activeAccount,
        (transactionHash) => {
          this.transactionHash = transactionHash;
        },
        (confirmationNumber, receipt) => {
          this.confirmation = confirmationNumber;
          this.finishProfile(receipt);
        },
      );
    },
    // When the file upload changes, we upload the profile picture to IPFS
    // for use in the dweller id card
    async uploadProfilePic(file) {
      this.profileFile = URL.createObjectURL(file);
      if (!file.type.includes('image')) {
        this.error = 'Please use an image for your profile picture.';
        return;
      }
      this.error = false;
      const ipfsResponse = await window.ipfs.add(file);
      this.ipfsHash = ipfsResponse;
    },
    // Set the dweller id profile picture hash on contract
    // after do any final tasks we need to do on chain
    async finishProfile(receipt) {
      if (!this.ipfsHash) {
        this.commitEverything(receipt);
        return;
      }

      const dwellerIDContract = await Vault74Registry
        .getDwellerContract(this.$store.state.activeAccount);

      let confirms = 0;
      this.$store.commit('setStatus', 'Transaction created, waiting for confirm');
      DCUtils.setPhoto(
        dwellerIDContract,
        this.$store.state.activeAccount,
        this.ipfsHash,
        () => {
          confirms += 1;
          this.finished = true;
          this.$store.commit('setStatus', 'Transaction confirmed');
          if (confirms >= 2 || !this.customFinalAction) {
            this.commitEverything(dwellerIDContract);
          }
        },
      );
    },
    // Note the changes to the profile locally in the store
    commitEverything(dwellerIDContract) {
      this.$store.commit('profilePictureHash', this.ipfsHash.path);
      this.$store.commit('dwellerAddress', dwellerIDContract);
      if (this.customFinalAction) this.customFinalAction();
    },
    // Get a dweler from the registry
    async getDweller() {
      this.$store.commit('setStatus', 'Fetching dweller from chain');
      DCUtils.getDweller(
        this.$store.state.dwellerAddress,
        (dweller, onChainPhotoHash) => {
          this.dweller = dweller;
          this.onChainPhotoHash = onChainPhotoHash;
        },
      );
    },
    async getDwellerByAddress(address) {
      this.dweller = await this.dwellerCachingHelper.getDweller(address);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./Profile.less"></style>
