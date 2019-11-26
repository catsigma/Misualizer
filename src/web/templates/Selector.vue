<template>
  <div>
    <div @click="click(v)" :class="{item: true, active: value === v}" :key="k" v-for="(v, k) in data">
      {{k}}
    </div>
    <div class="content-wrapper" v-if="$slots.default">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default: {}
    },
    value: String
  },
  data() {
    return {
    }
  },
  methods: {
    click(item) {
      this.$emit('input', item)
    }
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

div.item {
  display: inline-flex;
  padding: 4px 8px;
  color: $c5;
  cursor: pointer;
  border-radius: 4px;
}
div.item.active {
  background: $c9;
  color: $c6;
}
.content-wrapper {
  border: 1px solid $c9;
  border-top: none;
}
</style>