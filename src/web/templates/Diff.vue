<template>
  <div>
    <div class="input-wrapper">
      <div>
        <h2>Type</h2>
        <textarea placeholder="type value in JSON" class="mono" v-model="t"></textarea>
      </div>
      <div>
        <h2>Left</h2>
        <textarea placeholder="data value in JSON" class="mono left" v-model="left"></textarea>
      </div>
      <div>
        <h2>Right</h2>
        <textarea placeholder="data value in JSON" class="mono right" v-model="right"></textarea>
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

function local(key, v) {
  if (v === undefined) {
    return JSON.parse(localStorage.getItem(key))
  } else {
    return localStorage.setItem(key, JSON.stringify(v))
  }
}
function setDiff(key, v) {
  const diff_setting = local('diff') || {}
  diff_setting[key] = v
  local('diff', diff_setting)
}

export default {
  data() {
    return {
      left: '',
      right: '',
      t: '',
      state: 'idle'
    }
  },
  watch: {
    t(v) {
      setDiff('t', v)
    },
    left(v) {
      setDiff('left', v)
    },
    right(v) {
      setDiff('right', v)
    }
  },
  mounted() {
    const diff_setting = local('diff')
    if (diff_setting) {
      this.t = diff_setting.t
      this.left = diff_setting.left
      this.right = diff_setting.right
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

      const diff_result = Misualizer.diff(t, left, right)
      const renderer = Misualizer.getGraphRenderer()

      this.setSVG('result', renderer.renderDiff(diff_result))
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

  textarea.left {background: rgba(255, 0, 0, 0.05)}
  textarea.right {background: rgba(0, 255, 0, 0.05)}
}

.panel-center {
  padding: 8px;
  text-align: center
}
</style>