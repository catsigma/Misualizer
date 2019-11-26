<template>
  <div>
    <div class="block start">
      <h2>Start</h2>
      <div class="stack">
        <span class="mono">{{result.start}}</span>
      </div>
    </div>

    <div class="block result" :key="`result-${i}`" v-for="(result, i) in result.results">
      <h2>Result {{i}}</h2>
      <div class="cond">
        <span class="mono">{{result[0]}}</span>
      </div>
      <div class="stack">
        <span class="mono">{{result[1]}}</span>
      </div>
    </div>

    <div class="block fail" :key="`fail-${i}`" v-for="(fail, i) in result.fails">
      <h2>Fail {{i}}</h2>
      <div class="cond">
        <span class="mono">{{fail[0]}}</span>
      </div>
      <div class="stack">
        <span class="mono">{{fail[1]}}</span>
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

th {
  text-align: right;
  vertical-align: top;
}
.mono {
  font-size: 1.2rem;
}

.block {
  margin-bottom: 16px;

  .mono {
    margin-left: 8px;
  }
}

.start {
  h2 {
    color: $c2;
  }
}

.result {
  h2 {
    color: $c8;
  }
}

.fail {
  h2 {
    color: $c11;
  }
}

.stack {
  margin-left: 8px;

  &::before {
    display: block;
    content: 'Stack:';
    color: $c2;
  }
}

.cond {
  margin-left: 8px;

  &::before {
    display: block;
    content: 'Condition flow:';
    color: $c2;
  }
}
</style>