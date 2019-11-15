// @flow

export const t_reprs = {
  pair() {
    return `(${this.children[0].getVal()}, ${this.children[1].getVal()})`
  },
  list() {
    return `[${this.children.map(x => x.getVal()).join(', ')}]`
  },
  option() {
    if (this.raw === 'some')
      return `Some(${this.children[0].getVal()})`
    else if (this.raw === 'none')
      return `None`
    else if (this.continuation)
      return `Option(${this.continuation.getVal()})`
    else if (this.value)
      return `Option<${this.getType(this.t[1])}>(${this.value})`
    else
      throw `Invalid option element`
  }
}

export const reprs = {
  ADD() {
    const [s0, s1] = [this.getStackVal(0), this.getStackVal(1)]
    if (this.isConcrate(0, 1)) {
      return parseInt(s0) + parseInt(s1)
    } else
      return `${s0} + ${s1}`
  },
  AND() {
    const [s0, s1] = [this.getStackVal(0), this.getStackVal(1)]
    return `${s0} & ${s1}`
  },
  COMPARE() {
    return [this.getStackVal(0), this.getStackVal(1)]
  },
  GT() {
    const [a, b] = this.getStackVal(0)
    return `${a} > ${b}`
  },
  EQ() {
    const [a, b] = this.getStackVal(0)
    return `${a} == ${b}`
  },
  LE() {
    const [a, b] = this.getStackVal(0)
    return `${a} <= ${b}`
  },
  LT() {
    const [a, b] = this.getStackVal(0)
    return `${a} < ${b}`
  },
  FAILWITH() {
    return `FAIL(${this.getStackVal(0)})`
  },
  IMPLICIT_ACCOUNT() {
    return `CONTRACT(${this.getStackVal(0)})`
  },
  TRANSFER_TOKENS() {
    return `CALL(${this.getStackVal(2)}, ${this.getStackVal(1)}, ${this.getStackVal(0)})`
  },
  CONCAT() {
    const [a, b] = this.stack
    if (b)
      return `CONCAT(${a.getVal()}, ${b.getVal()})`
    else
      return `CONCAT(${a.getVal()})`
  },
  PACK() {
    return `PACK(${this.getStackVal(0)})`
  },
  CHECK_SIGNATURE() {
    const [key, signature, bytes] = this.getStackVals(0, 3)
    return `CHECK_SIG(${key}, ${signature}, ${bytes})`
  },
  CONTRACT() {
    return `CONTRACT(${this.getStackVal(0)})`
  },
  CREATE_CONTRACT() {
    return `CREATE_CONTRACT(${this.getStackVals(0, 3).join(', ')})`
  },
  MEM() {
    return `${this.getStackVal(0)} IN ${this.getStackVal(1)}`
  }
}



