// @flow

const Misualizer = window.Misualizer

import TBN from 'tezbridge-network/PsBabyM1'

const mainnet_host = 'https://rpc.tzbeta.net'
const babylonnet = 'https://rpctest.tzbeta.net'

const client = new TBN({
  host: mainnet_host
})

const address = 'KT1GgUJwMQoFayRYNwamRAYCvHBLzgorLoGo'

async function main() {
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

  for (const key in svgs) {
    document.body && document.body.appendChild(svgs[key])
  }
}

main()
