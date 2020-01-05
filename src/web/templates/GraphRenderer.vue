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
      <h2>Success graph</h2>
      <div ref="success"></div>
    </div>
    <div class="block">
      <h2>Failure graph</h2>
      <div ref="failure"></div>
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
      
      const renderer = new SVGRenderer()

      const fail_tree = {}
      const cond_mapping = {}
      contract.fail_stacks.forEach(stack => {
        stack.stack[0] = replaceElement(stack.stack[0], replace_pattern)
        stack.stack[0] = reduceElement(stack.stack[0])

        let cursor = fail_tree
        const subs = stack.stack[0].subs
        subs.forEach((item, index) => {
          if (!index) return;

          cond_mapping[item.id] = item

          if (index === subs.length - 1)
            cursor[item.id] = subs[0]
          else {
            if (!(item.id in cursor))
              cursor[item.id] = {}

            cursor = cursor[item.id]
          }
        })
      })
      
      const failure_wrapper = document.createElement('div')
      failure_wrapper.appendChild(renderer.renderTree(fail_tree, cond_mapping))

      this.setSVG('parameter', renderer.renderData(contract.stack.stack[0].subs[0]))
      this.setSVG('storage', renderer.renderData(contract.stack.stack[0].subs[1]))
      this.setSVG('success', renderer.render(stack))
      this.setSVG('failure', failure_wrapper)
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