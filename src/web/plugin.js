// @flow

import { Element, diffElement } from '../emu/elem'
import { Contract } from '../emu/contract'
import { SVGRenderer } from '../renderer/svg'
import { replaceElement, reduceElement } from '../renderer/repr'
import { createElementByType, mockValueFromType } from '../emu/micheline'

const Misualizer = {
  diff(t : Object, left : Object, right : Object) {
    const mock_elem = createElementByType(t, mockValueFromType(t))
    const left_elem = createElementByType(t, left)
    const right_elem = createElementByType(t, right)
    
    diffElement(mock_elem, left_elem, right_elem)
    
    const renderer = new SVGRenderer()
    return renderer.renderDiff(mock_elem)
  },
  contract(code : Object[], custom_param : Object, custom_storage : Object, custom_args : Object) {
    const contract = new Contract(code, custom_param, custom_storage, custom_args)
    const stack = contract.walkToExit()
    const replace_pattern = contract.genReplaceMap()
    stack.stack[0] = replaceElement(stack.stack[0], replace_pattern)
    stack.stack[0] = reduceElement(stack.stack[0])

    const renderer = new SVGRenderer()
    
    const fail_tree = {}
    const cond_mapping : {number: Element} = {}
    contract.fail_stacks.forEach(stack => {
      stack.stack[0] = replaceElement(stack.stack[0], replace_pattern)
      stack.stack[0] = reduceElement(stack.stack[0])

      let cursor = fail_tree
      const subs = stack.stack[0].subs
      subs.forEach((item, index) => {
        if (!index) return;

        cond_mapping[item.id] = item

        if (!(item.id in cursor))
          cursor[item.id] = {}
          
        if (index === subs.length - 1) {
          cursor[item.id].reason = subs[0]
        } else {
          cursor = cursor[item.id]
        }
      })
    })

    return {
      failure: renderer.renderTree(fail_tree, cond_mapping),
      parameter: renderer.renderData(contract.stack.stack[0].subs[0]),
      storage: renderer.renderData(contract.stack.stack[0].subs[1]),
      success: renderer.render(stack)
    }
  }
}

window.Misualizer = Misualizer