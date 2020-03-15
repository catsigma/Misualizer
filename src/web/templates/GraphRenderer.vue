<template>
  <div>
    <div class="tip" v-if="selected.graph_node">
      <div class="content mono">{{selected.graph_node.title}}</div>
    </div>
    <div class="desk">
      <div class="desk-left">
        <h2>
          <span>Contract graph</span>
          <a href="javascript:;" class="explain">(Explain)</a>
        </h2>
        <div ref="contract_graph"></div>
      </div>

      <div class="desk-right">
        <div class="operations">
          <h2>Operations</h2>
          <div>
            <button class="sm">Play</button>
            <button class="sm" @click="setCustom">Set custom value</button>
          </div>
        </div>
        <div class="custom">
          <div>
            <h2>Custom parameter</h2>
            <textarea placeholder="custom parameter value in JSON" class="mono" v-model="custom.param"></textarea>
          </div>
          <div>
            <h2>Custom storage</h2>
            <textarea placeholder="custom storage value in JSON" class="mono" v-model="custom.storage"></textarea>
          </div>
          <div>
            <h2>Custom arguments</h2>
            <textarea placeholder="custom arguments in JSON" class="mono custom-arguments" @input="argsChange" :value="JSON.stringify(custom.args, null, 2)"></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

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

      const script_code = this.contract.script.code

      const renderer = Misualizer.getGraphRenderer((node) => {
        console.log(node)
      })

      const stack = Misualizer.createStack({
        t: script_code[0].args[0],
        val: custom_param
      }, {
        t: script_code[1].args[0],
        val: custom_storage
      })
      stack.attached.renderValve = (valve) => {
        console.log('render sub valve')
      }

      const main_valve = Misualizer.createValve(script_code[2].args, stack)

      this.setSVG('contract_graph',  renderer.renderValve(main_valve))
    }
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

h2 {margin: 4px 0 0 0;}
.explain {
  color: $c5;
  text-decoration: none;
  font-weight: 400;
}
.desk {
  display: flex;
  justify-content: space-between;
}

.desk-left {
  width: 100%;
  margin-right: 8px;
}

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
  textarea {
    width: 300px;
    height: 200px;
    padding: 4px;
  }
}
</style>