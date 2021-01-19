<script>
import DCUtils from '@/utils/contracts/DwellerContract.ts';
import Vault74Registry from '@/utils/contracts/Vault74Registry.ts';

export default {
  name: 'ChangePhoto',
  props: ['changePhotoHandler', 'close', 'refresh'],
  data() {
    return {
      profileFile: false,
      error: false,
      ipfsHash: false,
      showCropper: false,
    };
  },
  mounted() {
    this.toggleCropper();
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
    async changePhoto() {
      const dwellerIDContract = await Vault74Registry
        .getDwellerContract(this.$store.state.activeAccount);

      this.$store.commit('setStatus', 'Transaction created, waiting for confirm');
      DCUtils.setPhoto(
        dwellerIDContract,
        this.$store.state.activeAccount,
        this.ipfsHash,
        () => {
          this.close();
          this.$store.commit('setStatus', 'Transaction confirmed');
          this.$store.commit('profilePictureHash', this.ipfsHash.path);
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
      this.$store.commit('setStatus', 'Uploading to IPFS');
      const ipfsResponse = await window.ipfs.add(file);
      this.$store.commit('setStatus', 'File uploaded to IPFS');
      this.ipfsHash = ipfsResponse;
      this.changePhoto();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  .change-photo {
    float: right;
  }
</style>
