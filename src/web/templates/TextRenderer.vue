<template>
  <div>
    <div class="block">
      <h2>Parameter</h2>
      <pre class="mono">{{result.parameter}}</pre>
    </div>
    <div class="block">
      <h2>Storage</h2>
      <pre class="mono">{{result.storage}}</pre>
    </div>
    <div class="block">
      <h2>Success</h2>
      <pre class="mono">{{result.body}}</pre>
    </div>
    <div class="block" :key="i" v-for="(fail, i) in result.fails">
      <h2>Failure</h2>
      <pre class="mono">{{fail}}</pre>
    </div>
  </div>
</template>

<script>
import { Contract } from '../../emu/contract'
import { TextRenderer } from '../../renderer/text'

export default {
  props: ['contract'],
  data() {
    return {
      result: {
        parameter: '',
        storage: '',
        body: '',
        fails: []
      }
    }
  },
  watch: {
    contract() {
      this.renderText()
    }
  },
  mounted() {
    this.renderText()
  },
  methods: {
    renderText() {
      if (!this.contract) return;
      
      const contract = new Contract(this.contract.script.code)
      const init_render = new TextRenderer(contract.stack)

      const stack = contract.walkToExit()

      const pattern = contract.genInstrPattern()
      const text_renderer = new TextRenderer(stack, pattern)

      const parameter = init_render.render(contract.stack.stack[0].subs[0])
      const storage = init_render.render(contract.stack.stack[0].subs[1])
      const body = text_renderer.render()
      const fails = contract.fail_stacks.map(stack => {
        const text_renderer = new TextRenderer(stack, pattern)
        return text_renderer.render()
      })

      this.result = {
        parameter,
        storage,
        body,
        fails 
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

.block {
  margin-bottom: 16px;

  .mono {
    font-size: 1.2rem;
  }
}
</style>