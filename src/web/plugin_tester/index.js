// @flow

import TBN from 'tezbridge-network/PsBabyM1'

const mainnet_host = 'https://rpc.tzbeta.net'
const babylonnet = 'https://rpctest.tzbeta.net'

const client = new TBN({
  host: mainnet_host
})

const address = 'KT1GgUJwMQoFayRYNwamRAYCvHBLzgorLoGo'

async function main() {
  const contract = await client.fetch.contract(address)
  console.log(contract)
}

main()
