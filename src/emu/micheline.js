// @flow

export type EType = Array<string | EType>

import { Element } from './elem'

type MichelineType = {prim: string, args?: Array<MichelineType>, annots?: Array<string>}

type MichelineInstr = {prim: string, args?: Array<MichelineInstr>, annots?: Array<string>}

// type MichelineValue = 
// | {int: string}
// | {string: string}
// | {bytes: string}
// | {prim: string, args?: Array<MichelineValue>, annots?: Array<string>} 
// | Array<{prim: 'Elt', args: [MichelineValue, MichelineValue]}>
// | Array<MichelineValue>
// | Array<MichelineInstr>

type MichelineValue = Object

const micheline_mapping = {
  int: new Set(['int', 'nat', 'mutez', 'timestamp']),
  string: new Set(['string', 'contract', 'key_hash', 'address', 'chain_id']),
  bytes: new Set(['bytes', 'key', 'signature'])
}

export function readType(t : MichelineType) : EType {
  if (t.args instanceof Array) {
    return [t.prim].concat(t.args.map(x => readType(x)))
  } else {
    return [t.prim]
  }
}
export function fallbackType(t : string | EType) : MichelineType {
  if (typeof t === 'string')
    return {prim: t}

  const t0 = typeof t[0] === 'string' ? t[0] : ''

  if (t.length > 1) {
    return {
      prim: t0,
      args: t.slice(1).map((x : string | EType) => fallbackType(x))
    }
  } else {
    return {prim: t0}
  }
}

export function createElementByType(t : MichelineType, v : MichelineValue, id : {val : number} = {val: 1}) : Element {
  const type_t = readType(t)
  const annots : Array<string> = v.annots ? v.annots : t.annots || []

  if (t.args) {
    const targ0 = t.args[0]
    const targ1 = t.args[1]

    if (t.prim === 'pair') {
      return new Element(id.val++, type_t, annots, '', null, [
        createElementByType(targ0, v.args[0], id),
        createElementByType(targ1, v.args[1], id)
      ])

    } else if (t.prim === 'or') {
      return new Element(id.val++, type_t, annots, v.prim, null, [
        createElementByType(targ0, v.args[0], id)
      ])
      
    } else if (t.prim === 'list' || t.prim === 'set') {
      return new Element(id.val++, type_t, annots, '', null, 
        v.args.map(item => createElementByType(targ0, item, id)))

    } else if (t.prim === 'map' || t.prim === 'big_map') {
      return new Element(id.val++, type_t, annots, '', null, v.args.map(item => 
        new Element(id.val++, ['elt'], item.annots || annots, '', null, [
          createElementByType(targ0, item.args[0], id),
          createElementByType(targ1, item.args[1], id)
        ])))

    } else if (t.prim === 'option') {
      return new Element(id.val++, type_t, annots, v.prim, null, 
        v.prim === 'Some' ? [createElementByType(targ0, v.args[0], id)] : [])

    } else if (t.prim === 'lambda') {
      const codes = v instanceof Array ? v : v.args[2]
      return new Element(id.val++, type_t, annots, '', codes, [])
    }

  } else {
    if (t.prim === 'unit' || t.prim === 'bool')
      return new Element(id.val++, type_t, annots, '', v.prim, [])
    else
      return new Element(id.val++, type_t, annots, '', Object.values(v)[0], [])
  }

  throw `createElementByType / invalid t: ${t.prim} v: ${v.prim}`
}

export function mockValueFromType(t : MichelineType, id : {val : number} = {val: 1}) : MichelineValue {
  if (t.args) {
    const targ0 = t.args[0]
    const targ1 = t.args[1]
    if (t.prim === 'pair') {
      return {prim: 'Pair', args: [
        mockValueFromType(targ0, id),
        mockValueFromType(targ1, id)
      ]}

    } else if (t.prim === 'or') {
      return {prim: 'Left', args: [mockValueFromType(targ0, id)]}
      
    } else if (t.prim === 'list' || t.prim === 'set') {
      return [mockValueFromType(targ0, id)]

    } else if (t.prim === 'map' || t.prim === 'big_map') {
      const result : Array<{prim: 'Elt', args: [MichelineValue, MichelineValue]}> = [{prim: 'Elt', args: [
        mockValueFromType(targ0, id),
        mockValueFromType(targ1, id)
      ]}]
      return result

    } else if (t.prim === 'option') {
      return {prim: 'Some', args: [mockValueFromType(t.args[0], id)]}

    } else if (t.prim === 'lambda') {
      return [{prim: 'RENAME', annots: ['']}]
    }

  } else {
    if (micheline_mapping.int.has(t.prim))
      return {int: `${t.prim}${id.val++}`}
    else if (micheline_mapping.string.has(t.prim))
      return {string: `${t.prim}${id.val++}`}
    else if (micheline_mapping.bytes.has(t.prim))
      return {bytes: `${t.prim}${id.val++}`}
    else if (t.prim === 'unit')
      return {prim: 'Unit'}
    else if (t.prim === 'bool')
      return {prim: 'True'}
  }

  throw `mockValueFromType / invalid Micheline type: ${t.prim}`
}