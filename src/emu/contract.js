// @flow

import { Element, ElementGroup } from './elem'

export class Contract {
  stack : Array<Element | ElementGroup>
  code : Array<Object>

  constructor(contract_raw : Array<Object>) {
    const contract = {}
    contract_raw.forEach(item => {
      const key = item.prim
      contract[key] = item.args
    })

    this.code = contract.code
    this.stack = [new Element({
      t: 'pair',
      children: [
        this.createElementFromTypes(contract.parameter[0], 'parameter'),
        this.createElementFromTypes(contract.storage[0], 'storage')
      ]
    })]
  }

  createElementFromTypes(t : Object, field : 'parameter' | 'storage' | 'generate' = 'generate') {
    return new Element({
      t: t.prim,
      annots: t.annots,
      children: t.args ? t.args.map(x => this.createElementFromTypes(t)) : []
    }, field)
  }
}