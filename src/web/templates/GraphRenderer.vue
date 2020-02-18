<template>
  <div>
    <div class="tip" v-if="selected.graph_node">
      <div class="content mono">{{selected.graph_node.title}}</div>
    </div>
    <div class="block">
      <h2>Parameter</h2>
      <div ref="parameter"></div>
    </div>
    <div class="block">
      <h2>Storage</h2>
      <div ref="storage"></div>
    </div>
    <div class="block">
      <div class="custom">
        <div>
          <h2>Custom parameter</h2>
          <textarea placeholder="custom parameter value in JSON" class="mono" v-model="custom.param"></textarea>
        </div>
        <div>
          <h2>Custom storage</h2>
          <textarea placeholder="custom storage value in JSON" class="mono" v-model="custom.storage"></textarea>
        </div>
      </div>
      <div class="custom">
        <div>
          <h2>Custom arguments</h2>
          <textarea placeholder="custom arguments in JSON" class="mono custom-arguments" @input="argsChange" :value="JSON.stringify(custom.args, null, 2)"></textarea>
        </div>
      </div>
      <button class="sm custom-set-btn" @click="setCustom">Set</button>
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
  props: ['contract', 'address'],
  data() {
    return {
      selected: {},
      custom: {
        param: '',
        storage: '',
        args: {
          self: 'SELF',
          now: 'NOW',
          source: 'SOURCE',
          sender: 'SENDER',
          chain_id: 'CHAIN_ID',
          amount: 'AMOUNT',
          balance: 'BALANCE'
        }
      }
    }
  },
  watch: {
    contract() {
      this.initCustom()
      this.renderGraph()
    }
  },
  mounted() {
    this.initCustom()
    this.renderGraph()
  },
  methods: {
    initCustom() {
      this.custom.param = ''
      this.custom.storage = JSON.stringify(this.contract.script.storage, null, 2)
      this.custom.args.self = this.address
    },
    setSVG(ref_name, svg) {
      const el = this.$refs[ref_name]
      while (el.firstChild) {
        el.removeChild(el.firstChild)
      }

      el.appendChild(svg)
    },
    argsChange(e) {
      this.custom.args = JSON.parse(e.target.value)
    },
    setCustom() {
      const custom_param = this.custom.param ? JSON.parse(this.custom.param) : null
      const custom_storage = this.custom.storage ? JSON.parse(this.custom.storage) : null
      this.renderGraph(custom_param, custom_storage)
    },
    renderGraph(custom_param, custom_storage) {
      if (!this.contract) return;
      
      const contract = new Contract(this.contract.script.code, custom_param, custom_storage, this.custom.args)
      const stack = contract.walkToExit()
      const replace_pattern = contract.genReplaceMap()
      stack.stack[0] = replaceElement(stack.stack[0], replace_pattern)
      stack.stack[0] = reduceElement(stack.stack[0])
      
      const renderer = new SVGRenderer()
      this.selected = renderer.selected

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

          if (!(item.id in cursor))
            cursor[item.id] = {}
            
          if (index === subs.length - 1) {
            cursor[item.id].reason = subs[0]
          } else {
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

.tip {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: $c3;
  color: $c6;
  z-index: 9;

  .content {
    padding: 4px 8px;
  }
}

.custom {
  margin-top: 8px;
  display: flex;
  flex-grow: 1;

  & > div {
    width: 100%;
    margin: 0 4px;
  }

  textarea {
    margin-top: 8px;
    width: 100%;
    height: 200px;
    padding: 4px;
    font-size: 1.2rem;
  }

}
textarea.custom-arguments {
  height: 150px;
  width: 400px;
  margin-bottom: 8px;
}
.custom-set-btn {
  margin: 4px; font-size: 1.4rem;
}
</style>