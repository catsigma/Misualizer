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

  // const contracts = ["accounts.tz.json","add1.tz.json","add1_list.tz.json","add_delta_timestamp.tz.json","add_timestamp_delta.tz.json","after_strategy.tz.json","always.tz.json","and.tz.json","append.tz.json","assert.tz.json","assert_cmpeq.tz.json","assert_cmpge.tz.json","assert_cmpgt.tz.json","assert_cmple.tz.json","assert_cmplt.tz.json","assert_cmpneq.tz.json","assert_eq.tz.json","assert_ge.tz.json","assert_gt.tz.json","assert_le.tz.json","assert_lt.tz.json","assert_neq.tz.json","at_least.tz.json","auction.tz.json","authentication.tz.json","bad_lockup.tz.json","balance.tz.json","big_map_entrypoints.tz.json","big_map_get_add.tz.json","big_map_magic.tz.json","big_map_mem.tz.json","big_map_to_self.tz.json","big_map_union.tz.json","build_list.tz.json","cadr_annotation.tz.json","chain_id.tz.json","check_signature.tz.json","compare.tz.json","compare_bytes.tz.json","concat.tz.json","concat_hello.tz.json","concat_list.tz.json","conditionals.tz.json","cons_twice.tz.json","contains_all.tz.json","cps_fact.tz.json","create_add1_lists.tz.json","create_contract.tz.json","data_publisher.tz.json","default_account.tz.json","delegatable_target.tz.json","diff_timestamps.tz.json","dign.tz.json","dipn.tz.json","dispatch.tz.json","dropn.tz.json","dugn.tz.json","empty.tz.json","empty_map.tz.json","exec_concat.tz.json","fail.tz.json","fail_amount.tz.json","faucet.tz.json","first.tz.json","forward.tz.json","get_map_value.tz.json","guestbook.tz.json","hardlimit.tz.json","hash_consistency_checker.tz.json","hash_key.tz.json","hash_string.tz.json","id.tz.json","if.tz.json","if_some.tz.json","infinite_loop.tz.json","insertion_sort.tz.json","int_publisher.tz.json","king_of_tez.tz.json","left_right.tz.json","list_concat.tz.json","list_concat_bytes.tz.json","list_id.tz.json","list_id_map.tz.json","list_iter.tz.json","list_map_block.tz.json","list_of_transactions.tz.json","lockup.tz.json","loop_left.tz.json","macro_annotations.tz.json","manager.tz.json","map_caddaadr.tz.json","map_car.tz.json","map_id.tz.json","map_iter.tz.json","map_size.tz.json","max_in_list.tz.json","min.tz.json","multiple_entrypoints_counter.tz.json","no_default_target.tz.json","no_entrypoint_target.tz.json","noop.tz.json","not.tz.json","or.tz.json","packunpack.tz.json","pair_id.tz.json","pair_macro.tz.json","parameterized_multisig.tz.json","pexec.tz.json","pexec_2.tz.json","queue.tz.json","reduce_map.tz.json","reentrancy.tz.json","replay.tz.json","reservoir.tz.json","ret_int.tz.json","reveal_signed_preimage.tz.json","reverse.tz.json","reverse_loop.tz.json","rooted_target.tz.json","scrutable_reservoir.tz.json","self.tz.json","set_caddaadr.tz.json","set_car.tz.json","set_cdr.tz.json","set_id.tz.json","set_iter.tz.json","set_member.tz.json","set_size.tz.json","slices.tz.json","spawn_identities.tz.json","split_bytes.tz.json","split_string.tz.json","store_input.tz.json","store_now.tz.json","str_id.tz.json","sub_timestamp_delta.tz.json","subset.tz.json","take_my_money.tz.json","tez_add_sub.tz.json","transfer_amount.tz.json","transfer_tokens.tz.json","unpair_macro.tz.json","vote_for_delegate.tz.json","weather_insurance.tz.json","xcat.tz.json","xcat_dapp.tz.json","xor.tz.json"]
  // contracts.forEach(async x => {
  //   const code = await getTestContract(x)
  //   await testTube(code)
  // })

  // const code = await getTestContract('pexec.tz.json')
  // await testTube(code)

  const address = 'KT1UvfyLytrt71jh63YV4Yex5SmbNXpWHxtg'
  // const address = 'KT1LSMRcE2sLqg6H1mmFHG7RVwYNEQnkAtc1'
  // const address = 'KT1GgUJwMQoFayRYNwamRAYCvHBLzgorLoGo'
  const contract = await client.fetch.contract(address)
  await testTube(contract.script.code)
}
main()

async function getTestContract(name : string) {
  const response = await fetch('/contracts/' + name)
  const json = await response.json()
  return json
}


async function testTube(code : Object) {
  const stack = Misualizer.createStack({
    t: code[0].args[0],
  }, {
    t: code[1].args[0]
  })
  
  const renderer = Misualizer.getGraphRenderer({
    click: (node) => {
      console.log(node)
      // const path1 = valve.stack_mem[node.id].map(x => x.path).sort()
      // const path2 = valve.getPaths(node)
      // console.log('path lst', path2)

      // renderer.glowGraphs(path2[0])
      // console.log(valve.flowByPath(path2[0]))
    }
  })
  stack.attached.renderValve = (valve) => {
    const g = renderer.renderValve(valve)
    document.body && document.body.appendChild(g)
  }

  const valve = Misualizer.createValve(code[2].args, stack)
  // console.log('valve', valve)
  // const {steps, ends, fails} = valve.flow()
  // console.log('steps', steps)
  // console.log('ends', ends.map(x => x.path))
  // console.log('fails', fails)
  
  // renderer.glowGraphs(ends.map(x => x.path)[0])
  
  const g = renderer.renderValve(valve)
  document.body && document.body.appendChild(g)
}
