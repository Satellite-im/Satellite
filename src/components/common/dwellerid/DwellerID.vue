<template src="./DwellerID.html"></template>

<script>
import Badge from '@/components/common/Badge';
import DwellerCachingHelper from '@/classes/DwellerCachingHelper.ts';
import config from '@/config/config';
import CircleIcon from '@/components/common/CircleIcon';

export default {
  name: 'ChatGroup',
  props: ['active', 'toggle', 'address'],
  components: {
    CircleIcon,
    Badge,
  },
  data() {
    return {
      dweller: false,
      dwellerCachingHelper: new DwellerCachingHelper(
        config.registryAddress,
        config.cacher.dwellerLifespan,
      ),
    };
  },
  methods: {
    /** @method
     * Setter
     * @name getDweller
     * @argument address address of the dweller to get from the cache
     */
    async getDweller(address) {
      this.dweller = await this.dwellerCachingHelper.getDweller(address);
    },
    /** @method
     * Setter
     * Sets the active chat to the current address and toggles the ID
     * @name message
     */
    message() {
      this.$store.commit('activeChat', this.address);
      this.toggle();
    },
  },
  mounted() {
    this.getDweller(this.address);
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./DwellerID.less"></style>
