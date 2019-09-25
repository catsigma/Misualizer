// @flow

import TBN from 'tezbridge-network/PsBABY5H'

import { Parser } from '../src/graph_lang'

// Init setup
const client = new TBN({
  host: 'https://alphanet-node.tzscan.io'
})

async function main() {
  const contract_info = await client.fetch.contract('KT18brAGvbtX8UGsKTAVex5k63YbZTYNzhpv')

  const code = contract_info.script.code
  console.log(code)
}


function parser() {
  const script = `
    contract abc123 {
      a -> b -> c
      b -> c [attr1=v1 attr2=v2]
      sd -> contract qqq {
        e -> w -> z
        vwef -> fe [x=y]
      } -> contract vooo {
        e -> wq -> x
      }
    }
  `

  const gl_parser = new Parser()
  console.log(gl_parser.parse(script))
}

// main()
parser()