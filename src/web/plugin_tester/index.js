// @flow

const Misualizer = window.Misualizer

import TBN from 'tezbridge-network/PsBabyM1'

const mainnet_host = 'https://rpc.tzbeta.net'
const babylonnet = 'https://rpctest.tzbeta.net'

const client = new TBN({
  host: mainnet_host
})

const address = 'KT1GgUJwMQoFayRYNwamRAYCvHBLzgorLoGo'

async function testContract() {
  const contract = await client.fetch.contract(address)
  const svgs = Misualizer.contract(contract.script.code, null, contract.script.storage, {
    "self": "KT1GgUJwMQoFayRYNwamRAYCvHBLzgorLoGo",
    "now": "NOW",
    "source": "SOURCE",
    "sender": "SENDER",
    "chain_id": "CHAIN_ID",
    "amount": "AMOUNT",
    "balance": "BALANCE"
  })

  for (const key in svgs.graphs) {
    document.body && document.body.appendChild(svgs.graphs[key])
  }
}

async function testDiff() {
  const t = {"prim":"or","args":[{"prim":"lambda","args":[{"prim":"unit"},{"prim":"list","args":[{"prim":"operation"}]}],"annots":["%do"]},{"prim":"or","args":[{"prim":"pair","args":[{"prim":"nat"},{"prim":"key_hash"}],"annots":["%_Liq_entry_play"]},{"prim":"or","args":[{"prim":"nat","annots":["%_Liq_entry_finish"]},{"prim":"unit","annots":["%_Liq_entry_fund"]}]}],"annots":[":_entries","%default"]}]}
  const v1 = {
    "prim": "Left",
    "args": [
      {
        "prim": "lambda",
        "args": [{"prim": "RENAME", "prim": [""]}]
      }
    ]
  }
  const v2 = {
    "prim": "Right",
    "args": [
      {
        "prim": "Left",
        "args": [
          {
            "prim": "pair",
            "args": [
              {
                "int": "3243"
              },
              {
                "string": "dfgsadg"
              }
            ]
          }
        ]
      }
    ]
  }
  const v3 = {
    "prim": "Right",
    "args": [
      {
        "prim": "Left",
        "args": [
          {
            "prim": "pair",
            "args": [
              {
                "int": "123"
              },
              {
                "string": "zzz"
              }
            ]
          }
        ]
      }
    ]
  }

  const diff_svg1 = Misualizer.diff(t, v1, v2)
  const diff_svg2 = Misualizer.diff(t, v2, v3)
  document.body && document.body.appendChild(diff_svg1.graph)
  document.body && document.body.appendChild(diff_svg2.graph)
}


async function main() {
  // await testContract()
  // testDiff()

  await testTube()
}
main()

async function testTube() {
  // const address = 'KT1UvfyLytrt71jh63YV4Yex5SmbNXpWHxtg'
  const address = 'KT1GgUJwMQoFayRYNwamRAYCvHBLzgorLoGo'
  // const address = 'KT1LSMRcE2sLqg6H1mmFHG7RVwYNEQnkAtc1'
  const contract = await client.fetch.contract(address)

  const stack = Misualizer.createStack({
    t: contract.script.code[0].args[0],
  }, {
    t: contract.script.code[1].args[0]
  })
  const valve = Misualizer.createValve(contract.script.code[2].args, stack)
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()
  // valve.flowOnce()

  console.log(valve)

  const renderer = Misualizer.getGraphRenderer()
  const g = renderer.renderValve(valve)
  document.body && document.body.appendChild(g)
}
