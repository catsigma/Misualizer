<template>
  <div>
    <div class="input-wrapper">
      <div>
        <h2>Type</h2>
        <textarea placeholder="data value in JSON" class="mono" v-model="t"></textarea>
      </div>
      <div>
        <h2>Left</h2>
        <textarea placeholder="data value in JSON" class="mono" v-model="left"></textarea>
      </div>
      <div>
        <h2>Right</h2>
        <textarea placeholder="data value in JSON" class="mono" v-model="right"></textarea>
      </div>
    </div>
    <div class="panel-center">
      <button class="sm" @click="diff">Diff</button>
    </div>
    <div class="result" v-if="result">
      <h2>Result</h2>
      <div ref="storage"></div>
    </div>
  </div>
</template>

<script>
import { Contract } from '../../emu/contract'
import { SVGRenderer } from '../../renderer/svg'
import { replaceElement, reduceElement } from '../../renderer/repr'
import { 
  readType, 
  fallbackType, 
  settingInstrID, 
  createElementByType, 
  mockValueFromType } from '../../emu/micheline'

export default {
  data() {
    return {
      left: '',
      right: '',
      t: '',
      result: null
    }
  },
  methods: {
    setSVG(ref_name, svg) {
      const el = this.$refs[ref_name]
      while (el.firstChild) {
        el.removeChild(el.firstChild)
      }

      el.appendChild(svg)
    },
    diff() {
      this.result = 1
      const parameter_raw_elem = createElementByType(
        this.contract.parameter, custom_param || mockValueFromType(this.contract.parameter, this.elem_id), this.elem_id)

      this.setSVG('parameter', renderer.renderData(contract.stack.stack[0].subs[0]))
    }
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

.input-wrapper {
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

.panel-center {
  padding: 8px;
  text-align: center
}
</style>