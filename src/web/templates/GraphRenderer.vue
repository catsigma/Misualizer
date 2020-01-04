<template>
  <div>
    <div class="block">
      <h2>Parameter</h2>
      <div ref="parameter"></div>
    </div>
    <div class="block">
      <h2>Storage</h2>
      <div ref="storage"></div>
    </div>
    <div class="block">
      <h2>Success</h2>
      <div ref="success"></div>
    </div>
    <div class="block">
      <h2>Failures</h2>
      <div ref="failures"></div>
    </div>
  </div>
</template>

<script>
import { Contract } from '../../emu/contract'
import { SVGRenderer } from '../../renderer/svg'
import { replaceElement, reduceElement } from '../../renderer/repr'

export default {
  props: ['contract'],
  data() {
    return {
      parameter: null,
      storage: null,
      success: null
    }
  },
  watch: {
    contract() {
      this.renderGraph()
    }
  },
  mounted() {
    this.renderGraph()
  },
  methods: {
    setSVG(ref_name, svg) {
      const el = this.$refs[ref_name]
      while (el.firstChild) {
        el.removeChild(el.firstChild)
      }

      el.appendChild(svg)
    },
    renderGraph() {
      if (!this.contract) return;
      
      const contract = new Contract(this.contract.script.code)
      const stack = contract.walkToExit()
      const replace_pattern = contract.genReplaceMap()
      stack.stack[0] = replaceElement(stack.stack[0], replace_pattern)
      stack.stack[0] = reduceElement(stack.stack[0])
      
      const init_renderer = new SVGRenderer(contract.stack)
      const body_renderer = new SVGRenderer(stack)
      const fails = document.createElement('div')
      contract.fail_stacks.forEach(stack => {
        stack.stack[0] = replaceElement(stack.stack[0], replace_pattern)
        stack.stack[0] = reduceElement(stack.stack[0])
        const renderer = new SVGRenderer(stack)
        fails.appendChild(renderer.render())
      })

      this.setSVG('parameter', init_renderer.renderData(contract.stack.stack[0].subs[0]))
      this.setSVG('storage', init_renderer.renderData(contract.stack.stack[0].subs[1]))
      this.setSVG('success', body_renderer.render())
      // this.setSVG('failures', fails)
    }
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

.block {
  margin-bottom: 16px;
}
</style>