// @flow

import { StackItem } from './stack'

type VType = Array<string | VType>

type MichelineType = {prim: string, args?: Array<MichelineType>, annots?: Array<string>}

type MichelineInstr = {prim: string, args?: Array<MichelineInstr>, annots?: Array<string>}

type MichelineValue = Object

const micheline_mapping = {
  int: new Set(['int', 'nat', 'mutez', 'timestamp']),
  string: new Set(['string', 'key_hash', 'address', 'chain_id']),
  bytes: new Set(['bytes', 'key', 'signature'])
}

export function fallbackType(t : string | VType) : MichelineType {
  if (typeof t === 'string')
    return {prim: t}

  const t0 = typeof t[0] === 'string' ? t[0] : ''

  if (t.length > 1) {
    return {
      prim: t0,
      args: t.slice(1).map((x : string | VType) => fallbackType(x))
    }
  } else {
    return {prim: t0}
  }
}

export function toVType(t : MichelineType) : VType {
  if (t.args instanceof Array) {
    return [t.prim].concat(t.args.map(x => toVType(x)))
  } else {
    return [t.prim]
  }
}

export function settingInstrID(item : StackItem, prefix : string = 'G') {
  let id = 1

  const walk = (item : StackItem) => {
    if (!item.annots.length)
      item.annots.push(prefix + id++)

    item.subs.forEach(item => walk(item))
  }
  walk(item)

  return item
}

export function createStackItem(t : MichelineType, v : MichelineValue) : StackItem {
  const type_t = toVType(t)
  const annots : Array<string> = v.annots ? v.annots : t.annots || []

  if (t.args) {
    const targ0 = t.args[0]
    const targ1 = t.args[1]

    if (t.prim === 'pair') {
      return new StackItem(type_t, annots, '', null, [
        createStackItem(targ0, v.args[0]),
        createStackItem(targ1, v.args[1])
      ])

    } else if (t.prim === 'or') {
      return new StackItem(type_t, annots, v.prim, null, v.prim === 'Left' ? [
        createStackItem(targ0, v.args[0])
      ] : v.prim === 'Right' ? [createStackItem(targ1, v.args[0])] : [
        createStackItem(targ0, v.args[0]),
        createStackItem(targ1, v.args[1])
      ])
      
    } else if (t.prim === 'list' || t.prim === 'set') {
      return new StackItem(type_t, annots, '', null, 
        v.map(item => createStackItem(targ0, item)))

    } else if (t.prim === 'map' || t.prim === 'big_map') {
      return new StackItem(type_t, annots, '', null, v.map(item => 
        new StackItem(['elt'], item.annots || annots, '', null, [
          createStackItem(targ0, item.args[0]),
          createStackItem(targ1, item.args[1])
        ])))

    } else if (t.prim === 'option') {
      return new StackItem(type_t, annots, v.prim, null, 
        v.prim === 'Some' ? [createStackItem(targ0, v.args[0])] : [])

    } else if (t.prim === 'contract') {
      return new StackItem(type_t, annots, '', v.string, [])
      
    } else if (t.prim === 'lambda') {
      const codes = v instanceof Array ? v : v.args[2]
      return new StackItem(type_t, annots, '', codes, [])
    }

  } else {
    if (t.prim === 'unit' || t.prim === 'bool')
      return new StackItem(type_t, annots, '', v.prim, [])
    else
      return new StackItem(type_t, annots, '', Object.values(v)[0], [])
  }

  debugger
  throw `createStackItem / invalid t: ${t.prim} v: ${v.prim}`
}

export function mockData(t : MichelineType) : MichelineValue {
  if (t.args) {
    const targ0 = t.args[0]
    const targ1 = t.args[1]
    if (t.prim === 'pair') {
      return {prim: 'Pair', args: [
        mockData(targ0),
        mockData(targ1)
      ]}

    } else if (t.prim === 'or') {
      return {prim: 'Left|Right', args: [mockData(targ0), mockData(targ1)]}
      
    } else if (t.prim === 'list' || t.prim === 'set') {
      return [mockData(targ0)]

    } else if (t.prim === 'map' || t.prim === 'big_map') {
      const result : Array<{prim: 'Elt', args: [MichelineValue, MichelineValue]}> = [{prim: 'Elt', args: [
        mockData(targ0),
        mockData(targ1)
      ]}]
      return result

    } else if (t.prim === 'option') {
      return {prim: 'Some|None', args: [mockData(t.args[0])]}

    } else if (t.prim === 'contract') {
      return {string: ``}

    } else if (t.prim === 'lambda') {
      return [{prim: 'RENAME', annots: ['']}]
    }

  } else {
    if (micheline_mapping.int.has(t.prim))
      return {int: ``}
    else if (micheline_mapping.string.has(t.prim))
      return {string: ``}
    else if (micheline_mapping.bytes.has(t.prim))
      return {bytes: ``}
    else if (t.prim === 'unit')
      return {prim: 'Unit'}
    else if (t.prim === 'bool')
      return {prim: 'True|False'}
  }

  debugger
  throw `mockData / invalid Micheline type: ${t.prim}`
}