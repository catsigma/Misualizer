<template>
  <div>
    <div :class="{header: true, 'header-expand': state === 'loaded' || state === 'reloading' || state === 'diff'}">
      <div class="nav">
        <a href="javascript:;" @click="state = 'diff'">Diff</a>
        <a href="https://github.com/catsigma/Misualizer" target="_blank">Github</a>
      </div>
      <a class="logo" href="/index.html">Misualizer</a>
      <input class="mono address-input" placeholder="Enter the KT1 address or contract code JSON" v-model="address" />
      <selector :data="nets" v-model="net_type" class="net-selector"></selector>
      <button @click="checkContract" :disabled="state === 'reloading'">
        <span v-if="state !== 'reloading'">Check</span>
        <loading v-if="state === 'reloading'"></loading>
      </button>
    </div>

    <transition name="bounce">
      <div class="index-center" v-if="state === 'initial' || state === 'loading'">
        <div class="logo">
          <img src="../favicon.png" />
          <span>Misualizer</span>
          <span class="version">v{{version}}</span>
        </div>
        <input class="mono address-input" placeholder="Enter the KT1 address or contract code JSON" v-model="address" />
        <selector :data="nets" v-model="net_type" class="net-selector"></selector>
        <button @click="checkContract" :disabled="state === 'loading'">
          <span v-if="state !== 'loading'">Check contract</span>
          <loading v-if="state === 'loading'"></loading>
        </button>
      </div>
    </transition>
    
    <transition name="fade">
      <div class="wrapper" v-if="state === 'loaded' || state === 'reloading'">
        <div class="tabs">
          <selector :data="renderers" v-model="renderer" class="renderer-selector"></selector>
        </div>
        <div class="content-wrapper" v-if="renderer === 'text'">
          <text-renderer :contract="contract_raw" :address="address"></text-renderer>
        </div>
        <div class="content-wrapper" v-if="renderer === 'graph'">
          <graph-renderer :contract="contract_raw" :address="address"></graph-renderer>
        </div>
        <div class="content-wrapper" v-if="renderer === 'raw'">
          <raw-renderer :contract="contract_raw" :address="address"></raw-renderer>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div class="wrapper" v-if="state === 'diff'">
        <diff></diff>
      </div>
    </transition>
  </div>
</template>

<script>
import { version } from '../../../package.json'
import TBN from 'tezbridge-network/PsBabyM1'
import Selector from './Selector'
import Loading from './Loading'

import RawRenderer from './RawRenderer'
import GraphRenderer from './GraphRenderer'
import Diff from './Diff'

import { getQuery } from '../../utils'

export default {
  components: {
    Loading,
    Selector,
    RawRenderer,
    GraphRenderer,
    Diff
  },
  data() {
    return {
      version,
      nets: {
        mainnet: 'mainnet',
        testnet: 'testnet'
      },
      net_type: 'mainnet',
      renderers: {
        graph: 'graph',
        raw: 'raw'
      },
      renderer: 'graph',
      address: '',
      state: 'initial',
      contract_raw: null
    }
  },
  watch: {
    state(v) {
      if (v === 'diff')
        location.hash = ''
    }
  },
  methods: {
    async checkContract() {
      if (this.address.trim().slice(0, 3) === 'KT1') {
        const host = {
          mainnet: 'https://rpc.tzbeta.net',
          testnet: 'https://rpctest.tzbeta.net'
        }[this.net_type]

        const client = new TBN({
          host
        })

        const prev_state = this.state
        try {
          this.state = this.state === 'initial' ? 'loading' : 'reloading'
          this.contract_raw = await client.fetch.contract(this.address)
          this.state = 'loaded'
          location.hash = `contract=${this.address}&net_type=${this.net_type}`
        } catch (e){
          this.state = prev_state
        }
      } else {
        try {
          const content = JSON.parse(this.address)
          if (content instanceof Array) {
            this.contract_raw = {
              script: {
                storage: undefined,
                code: content
              }
            }
            this.address = 'CUSTOM'
            this.state = 'loaded'
            location.hash = ''
          }
        } catch (e) {
          window.alert('Invalid address or contract code JSON')
        }
      }
    }
  },
  async mounted() {
    const contract = getQuery('contract')
    const net_type = getQuery('net_type')
    if (contract && net_type) {
      this.address = contract
      this.net_type = net_type
      await this.checkContract(contract, net_type)
    }
  }
}
</script>

<style scoped lang="scss">
@import "../colors";

.wrapper {
  margin: 8px;
}

.tabs {
  .renderer-selector {
    display: inline-block;
    border: 1px solid $c9;
    border-radius: 4px;
    padding: 4px;
  }
}

.content-wrapper {
  margin-top: 8px;
  padding: 4px;
  background: lighten($c6, 10%);
}

.address-input { font-size: 1.2rem; }
.header {
  display: flex;
  height: 48px;
  margin-top: -45px;
  background: $c10;
  align-items: center;

  .logo {
    text-decoration: none;
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
    img {
      width: 32px;
      vertical-align: text-bottom;
    }

    font-weight: 800;
    color: $c16; 
    margin-bottom: 32px;
    
    span {
      font-size: 4rem;
      vertical-align: baseline ;
    }

    .version {
      font-weight: 400;
      font-size: 1.2rem;
      color: $c2;
    }
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

.nav {
  position: absolute;
  top: 12px;
  right: 8px;

  a {
    color: $c5;
    margin: 0 2px;
    text-decoration: none;
  }
}
</style>