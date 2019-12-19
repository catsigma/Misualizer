<template>
  <div>
    <div class="block">
      <pre class="mono">{{result.init}}</pre>
    </div>
    <div class="block">
      <pre class="mono">{{result.body}}</pre>
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
        init: null,
        body: null
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
      init_render.is_raw = true

      const stack = contract.walkToExit()
      const patterns = contract.genInstrPatterns()
      const text_renderer = new TextRenderer(stack, patterns)
      this.result = {
        init: init_render.render(),
        body: text_renderer.render()
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