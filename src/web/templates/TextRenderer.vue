<template>
  <div>
    <div class="mono">
      {{result.start}}
    </div>
    <div :key="`result-${i}`" v-for="(result, i) in result.results">
      <div class="mono">
        {{result[0]}}
      </div>
      <div class="mono">
        {{result[1]}}
      </div>
    </div>
    <div :key="`fail-${i}`" v-for="(fail, i) in result.fails">
      <div class="mono">
        {{fail[0]}}
      </div>
      <div class="mono">
        {{fail[1]}}
      </div>
    </div>
  </div>
</template>

<script>
import { Contract } from '../../emu/contract'

export default {
  props: ['contract'],
  data() {
    return {
      result: {
        start: '',
        fails: [],
        results: []
      }
    }
  },
  mounted() {
    const contract = new Contract(this.contract.script.code)
    const stacks = contract.walkToExit()
    this.result = contract.stacksToText(stacks)
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

.mono {
  margin-bottom: 16px;
  font-size: 1.2rem;
}
</style>