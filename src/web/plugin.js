// @flow

import { Element, diffElement } from '../emu/elem'
// import { Contract, Stack } from '../emu/contract'
// import { SVGRenderer } from '../renderer/svg'
import { replaceElement, reduceElement } from '../renderer/repr'
import { createElementByType, mockValueFromType } from '../emu/micheline'

import { createStackItem, mockData, toVType, settingInstrID } from '../emu/tube/micheline'
import { codeConvert, Valve } from '../emu/tube/tube'
import { Stack, StackItem } from '../emu/tube/stack'
import { SVGRenderer } from '../renderer/tube'


const Misualizer = {
  getGraphRenderer(node_binding : {string : (...Object) => void}) {
    return new SVGRenderer(node_binding)
  },
  createStack(parameter : {t: Object, val?: Object}, storage: {t: Object, val?: Object}) {
    const p = createStackItem(parameter.t, parameter.val || mockData(parameter.t))
    const s = createStackItem(storage.t, storage.val || mockData(storage.t))
    settingInstrID(p, 'P')
    settingInstrID(s, 'S')
    return new Stack(
      0, 
      [new StackItem(['pair', toVType(parameter.t), toVType(storage.t)], [], '', null, [p, s])],
      [],
      undefined,
      {
        parameter_vtype: toVType(parameter.t)
      }
    )
  },
  createValve(code : Object, stack : Stack, init_id? : number) {
    const result = codeConvert(code, init_id)
    return new Valve(result.tube, result.id_mapping, stack, result.id)
  }
  // diff(t : Object, left : Object, right : Object) {
  //   const mock_elem = createElementByType(t, mockValueFromType(t))
  //   const left_elem = createElementByType(t, left)
  //   const right_elem = createElementByType(t, right)
    
  //   diffElement(mock_elem, left_elem, right_elem)
    
  //   const renderer = new SVGRenderer()
  //   return {
  //     renderer,
  //     graph: renderer.renderDiff(mock_elem)
  //   }
  // },
  // contract(code : Object[], custom_param : Object, custom_storage : Object, custom_args : Object) {
  //   const contract = new Contract(code, custom_param, custom_storage, custom_args)
  //   const stack = contract.walkToExit()
  //   const replace_pattern = contract.genReplaceMap()
  //   stack.stack[0] = replaceElement(stack.stack[0], replace_pattern)
  //   stack.stack[0] = reduceElement(stack.stack[0])

  //   const renderer = new SVGRenderer()
    
  //   const fail_tree = {}
  //   const cond_mapping : {number: Element} = {}
  //   contract.fail_stacks.forEach(stack => {
  //     stack.stack[0] = replaceElement(stack.stack[0], replace_pattern)
  //     stack.stack[0] = reduceElement(stack.stack[0])

  //     let cursor = fail_tree
  //     const subs = stack.stack[0].subs
  //     subs.forEach((item, index) => {
  //       if (!index) return;

  //       cond_mapping[item.id] = item

  //       if (!(item.id in cursor))
  //         cursor[item.id] = {}
          
  //       if (index === subs.length - 1) {
  //         cursor[item.id].reason = subs[0]
  //       } else {
  //         cursor = cursor[item.id]
  //       }
  //     })
  //   })

  //   return {
  //     renderer,
  //     contract,
  //     graphs: {
  //       failure: renderer.renderTree(fail_tree, cond_mapping),
  //       parameter: renderer.renderData(contract.stack.stack[0].subs[0]),
  //       storage: renderer.renderData(contract.stack.stack[0].subs[1]),
  //       success: renderer.render(stack)
  //     }
  //   }
  // }
}

window.Misualizer = Misualizer