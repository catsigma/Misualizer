<template>
  <div>
    <div class="input-wrapper">
      <div>
        <h2>Type</h2>
        <textarea placeholder="type value in JSON" class="mono" v-model="t"></textarea>
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
      <button class="sm" @click="diff">Check diff</button>
    </div>
    <div class="result" v-show="state === 'display'">
      <h2>Result</h2>
      <div ref="result"></div>
    </div>
  </div>
</template>

<script>
import { Contract } from '../../emu/contract'

export default {
  data() {
    return {
      left: '',
      right: '',
      t: '',
      state: 'idle'
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
      const t = JSON.parse(this.t)
      const left = JSON.parse(this.left)
      const right = JSON.parse(this.right)

      const diff_svg = Misualizer.diff(t, left, right)
      this.setSVG('result', diff_svg)
      this.state = 'display'
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