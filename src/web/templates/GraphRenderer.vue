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

      const { renderer, graphs } = Misualizer.contract(this.contract.script.code, custom_param, custom_storage, this.custom.args)
      this.selected = renderer.selected

      const failure_wrapper = document.createElement('div')
      failure_wrapper.appendChild(graphs.failure)

      this.setSVG('parameter', graphs.parameter)
      this.setSVG('storage', graphs.storage)
      this.setSVG('success', graphs.success)
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