<template>
  <div>
    <div class="code-block" v-if="code_block && options.show_code_block">
      <pre class="mono">{{code_block}}</pre>
    </div>
    
    <div class="node-inspect" :style="{left: options.show_code_block ? '212px' : '8px'}" v-if="inspect_result && hover_node && hover_node.id in inspect_result">
      <div class="stack mono" 
           :key="i" 
           v-for="(stack, i) in inspect_result[hover_node.id] instanceof Array ? inspect_result[hover_node.id] : [inspect_result[hover_node.id]]">
        <b>{{hover_node.t && inspect_result[hover_node.id].length > 1 ? (i ? 'Right' : 'Left') : 'Stack'}}:</b> 
        <span :key="i" v-for="(item, i) in stack.toStringLst()" v-html="stackRepr(item)"></span>
      </div>
    </div>

    <div class="path" v-if="path_lst.length">
      <div class="path-wrapper">
        <div :class="{'path-item': true, selected: selected_path === path}" :key="i" v-for="(path, i) in path_lst" 
             @mouseenter="glowPath(path)" 
             @mouseleave="glowPath()" 
             @click="flowByPath(path)">
          {{path.join(' -> ')}}
        </div>
      </div>
    </div>
    <div class="desk">
      <div class="desk-left">
        <h2>
          <span>Contract graph</span>
          <a target="_blank" href="https://github.com/catsigma/Misualizer/wiki/Analyzing-contract#explanation" class="explain">(Explain)</a>
        </h2>
        <div ref="contract_graph"></div>
      </div>

      <div class="desk-right">
        <!-- <div class="operations">
          <h2>Operations</h2>
          <div>
            <button class="sm" @click="inspectAll">Inspect all stacks</button>
            <button class="sm" @click="inspectOne">Inspect one step</button>
          </div>
        </div> -->
        <div class="options">
          <h2>Options</h2>
          <ul class="check-list">
            <li>
              <input type="checkbox" v-model="options.show_id" /><label>Show nodes' ID</label>
            </li>
            <li>
              <input type="checkbox" v-model="options.show_code_block" /><label>Show nodes' code block</label>
            </li>
            <li>
              <input type="checkbox" v-model="options.show_annots" /><label>Show annots</label>
            </li>
            <li>
              <input type="checkbox" v-model="options.use_custom_param" /><label>Using custom parameters</label>
              <div class="custom" v-if="options.use_custom_param">
                <button class="sm" @click="renderGraph()">Confirm</button>
                <div>
                  <h2>Custom parameter</h2>
                  <textarea placeholder="custom parameter value in JSON" class="mono" v-model="custom.param"></textarea>
                </div>
                <div>
                  <h2>Custom storage</h2>
                  <textarea placeholder="custom storage value in JSON" class="mono" v-model="custom.storage"></textarea>
                </div>
                <div>
                  <h2>Custom environment arguments</h2>
                  <textarea placeholder="custom arguments in JSON" class="mono custom-arguments" @input="argsChange" :value="JSON.stringify(custom.args, null, 2)"></textarea>
                </div>
              </div>
            </li>
          </ul>
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
      options: {
        show_id: true,
        show_code_block: true,
        show_annots: true,
        use_custom_param: false
      },
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
      },
      main_valve: null,
      valves: new Set(),
      selected_valve: null,
      renderer: null,
      inspect_result: null,
      path_lst: [],
      hover_node: null,
      code_block: '',
      selected_path: null
    }
  },
  watch: {
    contract() {
      this.initCustom()
      this.renderGraph()
    },
    'options.show_id'() {
      this.renderGraph()
    },
    'options.show_annots'() {
      this.renderGraph()
    }
  },
  mounted() {
    this.initCustom()
    this.renderGraph()
  },
  methods: {
    stackRepr(item) {
      item = item.replace(/\<|\>/g, x => {
        if (x === '<')
          return '&lt'
        else
          return '&gt'
      }).replace(/#.+?#/g, x => {
        return this.options.show_annots ? 
          `<span class="annot">${x.slice(1, -1)}</span>` : ''
      })

      return item
    },
    initCustom() {
      this.custom.param = ''
      this.custom.storage = JSON.stringify(this.contract.script.storage, null, 2)
      this.custom.args.self = this.address
    },
    setSVG(ref_name, svg, remove_children = true) {
      const el = this.$refs[ref_name]
      if (remove_children)
        while (el.firstChild) {
          el.removeChild(el.firstChild)
        }

      el.appendChild(svg)
    },
    argsChange(e) {
      this.custom.args = JSON.parse(e.target.value)
    },
    inspectOne() {

    },
    inspectAll() {
      if (this.main_valve) {
        if (confirm('This process could get stuck if there are too many condition branchs in contract\nDo you want to continue?')) {
          this.inspect_result = this.main_valve.flow()
        }
      }
    },
    glowPath(path) {
      const p = path || this.selected_path
      if (p)
        this.renderer.glowGraphs(p)
    },
    flowByPath(path) {
      this.selected_path = path
      this.inspect_result = (this.selected_valve || this.main_valve).flowByPath(path)
    },
    renderGraph() {
      if (!this.contract) return;

      const [custom_param, custom_storage] = this.options.use_custom_param ?
        [
          this.custom.param.trim() ? JSON.parse(this.custom.param) : null, 
          this.custom.storage.trim() ? JSON.parse(this.custom.storage) : null
        ] : []

      const script_code = this.contract.script.code

      this.renderer = Misualizer.getGraphRenderer({
        click: (node) => {
          this.valves.forEach(valve => {
            if (!(node.id in valve.id_mapping))
              return;

            this.selected_valve = valve
            this.path_lst = valve.getPaths(node).sort((a,b) => a.length - b.length)
            this.glowPath(this.path_lst[0])
            this.flowByPath(this.path_lst[0])
            this.hover_node = node
            this.code_block = node.t || JSON.stringify(node.code, null, 2)
          })
        },
        mouseenter: (node) => {
          if (this.inspect_result && node.id in this.inspect_result) {
            this.hover_node = node
            this.code_block = node.t || JSON.stringify(node.code, null, 2)
          }
        }
      })
      
      const stack = Misualizer.createStack({
        t: script_code[0].args[0],
        val: custom_param
      }, {
        t: script_code[1].args[0],
        val: custom_storage
      }, this.options.use_custom_param ? this.custom.args : undefined)
      stack.attached.renderValve = (valve) => {
        if (this.valves.has(valve))
          return;

        this.valves.add(valve)
        this.setSVG('contract_graph',  this.renderer.renderValve(valve, this.options), false)
      }

      this.main_valve = Misualizer.createValve(script_code[2].args, stack)
      this.valves.add(this.main_valve)
      this.setSVG('contract_graph',  this.renderer.renderValve(this.main_valve, this.options))
    }
  }
}
</script>

<style lang="scss">
@import "../colors";

.stack {
  * {
    font-size: 1.2rem;
    vertical-align: baseline;
  }
  
  b {
    color: $c3;
  }

  span {
    display: inline-block;
    margin: 2px 4px 2px 0;
    border-radius: 4px;
    background: $c6;
    color: $c16;
    padding: 0 2px;
    font-size: 1.2rem;
    
  }

  span.annot {
    margin: 0;
    background: $c4;
    color: white;
  }
}
</style>

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
.desk-right {
  min-width: 200px;
}

.block {
  margin-bottom: 16px;
}

$bg: $c5;

.code-block {
  position: fixed;
  padding: 4px;
  left: 8px;
  bottom: 4px;
  background: $bg;
  height: 300px;
  width: 200px;
  z-index: 8;

  pre {
    padding: 2px;
    color:  $c3;
    background: $c6;
    height: 292px;
    overflow: auto;
  }
}

.node-inspect {
  position: fixed;
  bottom: 4px;
  left: 212px;
  right: 224px;
  padding: 2px 4px;
  background: $bg;
  color: $c3;
  z-index: 9;
}

.path {
  position: fixed;
  bottom: 4px;
  right: 8px;
  width: 212px;
  background: $bg;
  color: $c6;
  z-index: 9;

  .path-wrapper {
    margin: 2px 4px;
  }

  .path-item {font-size: 1.2rem; margin: 4px 0; padding: 0 2px; border-radius: 2px;}
  .path-item:hover, .path-item.selected {background: $c6; color: $c5; cursor: pointer}
}


button {
  margin-top: 4px;
}

.custom {
  textarea {
    font-size: 1.2rem;
    width: 200px;
    height: 200px;
    padding: 4px;
  }
}
</style>