<template>
  <div>
    <div class="parameter">
      <h3>Parameter:</h3>
      <textarea v-model="parameter"></textarea>
      <h3>Storage:</h3>
      <textarea v-model="storage"></textarea>
    </div>
  </div>  
</template>

<script>
import { Contract } from '../../emu/contract'

export default {
  props: ['contract'],
  data() {
    return {
      parameter: '{}',
      storage: '{}'
    }
  },
  watch: {
    contract() {
      this.parseContract()
    }
  },
  mounted() {
    this.parseContract()
  },
  methods: {
    parseContract() {
      const script = {}
      const contract = new Contract(this.contract.script.code)
    }
  }
}
</script>

<style scoped>

</style>