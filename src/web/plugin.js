// @flow

import { createStackItem, mockData, toVType, settingInstrID } from '../emu/micheline'
import { codeConvert, Valve } from '../emu/tube'
import { Stack, StackItem } from '../emu/stack'
import { SVGRenderer } from '../renderer/tube'
import { diffStackItem } from '../emu/diff'

const Misualizer = {
  getGraphRenderer(node_binding? : {string : (...Object) => void}) {
    return new SVGRenderer(node_binding)
  },
  createStack(parameter : {t: Object, val?: Object}, storage: {t: Object, val?: Object}, env? : Object) {
    const p = createStackItem(parameter.t, parameter.val || mockData(parameter.t))
    const s = createStackItem(storage.t, storage.val || mockData(storage.t))
    settingInstrID(p, 'P')
    settingInstrID(s, 'S')
    return new Stack(
      0, 
      [new StackItem(['pair', toVType(parameter.t), toVType(storage.t)], [], '', null, [p, s])],
      [],
      env,
      {
        parameter_vtype: toVType(parameter.t)
      }
    )
  },
  createValve(code : Object, stack : Stack, init_id? : number) {
    const result = codeConvert(code, init_id)
    return new Valve(result.tube, result.id_mapping, stack, result.id)
  },
  diff(t : Object, left : Object, right : Object) {
    const base_item = createStackItem(t, mockData(t))
    const left_item = createStackItem(t, left)
    const right_item = createStackItem(t, right)

    return diffStackItem(base_item, left_item, right_item)
  }
}

window.Misualizer = Misualizer