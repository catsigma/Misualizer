<template>
  <div>
    <div :class="{header: true, 'header-expand': state === 'checking'}">
      <div class="logo">Misualizer</div>
      <input class="mono" placeholder="Enter the KT1 address here" v-model="address" />
      <selector :data="nets" v-model="net_type" class="net-selector"></selector>
      <button>Check</button>
    </div>
    <transition name="bounce">
      <div class="index-center" v-if="state === 'initial'">
        <div class="logo">Misualizer</div>
        <input class="mono" placeholder="Enter the KT1 address here" v-model="address" />
        <selector :data="nets" v-model="net_type" class="net-selector"></selector>
        <button @click="checkContract">Check contract</button>
      </div>
    </transition>
  </div>
</template>

<script>
import Selector from './Selector'

export default {
  components: {
    Selector
  },
  data() {
    return {
      nets: {
        mainnet: 'mainnet',
        babylonnet: 'babylonnet',
        carthagenet: 'carthagenet'
      },
      net_type: 'mainnet',
      address: '',
      state: 'initial'
    }
  },
  methods: {
    checkContract() {
      this.state = 'checking'
    }
  },
  watch: {
    state(s) {
    }
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

.header {
  display: flex;
  height: 48px;
  margin-top: -45px;
  background: $c10;
  align-items: center;

  .logo {
    font-weight: 800;
    display: inline-block;
    margin: 0 16px;
    font-size: 1.8rem;
    color: $c5;
  }

  .net-selector {
    display: inline-block;
    margin: 0 16px;
  }

  input {
    border: 0;
    border-radius: 0;
    padding: 4px 8px;
    width: 350px;
    color: $c2;
    font-size: 1.2rem;

    &::placeholder {
      color: $c1;
    }
  }

  button {
    display: inline-block;
    padding: 4px 8px;
    font-size: 1.4rem;
    border: 1px solid $c6;
    border-radius: 4px;
  }
}
.header-expand {
  margin-top: 0;
}


.index-center {
  margin: 96px auto; 
  width: 350px;
  text-align: center;

  .net-selector {
    margin: 24px 0 8px 0;
  }

  .logo {
    font-weight: 800;
    font-size: 4rem;
    color: $c15; 
    margin-bottom: 32px;
  }

  input {
    display: block; 
    border: 2px solid $c11;
    box-shadow: 4px 4px 0 0 $c11;
    border-radius: 0;
    padding: 8px;
    width: 100%;
    text-align: center;
    color: $c2;

    &::placeholder {
      color: $c1;
    }
 }

  button {
    margin: 16px auto;
  }
}
</style>