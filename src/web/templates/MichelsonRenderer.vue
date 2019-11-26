<template>
  <div>
    <pre class="mono">{{michelson}}</pre>
  </div>
</template>

<script>
export default {
  props: ['contract'],
  data() {
    return {
      michelson: ''
    }
  },
  mounted() {
    const contract = {}
    this.contract.script.code.forEach(x => {
      contract[x.prim] = x.args[0]
    })
    
    console.log(contract)
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

</style>