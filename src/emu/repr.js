// @flow

export const t_reprs = {
  pair() {
    return `(${this.children[0].getVal()}, ${this.children[1].getVal()})`
  },
  list() {
    return `[${this.children.map(x => x.getVal()).join(', ')}]`
  },
  option() {
    return this.children.length ? `Some(${this.children[0].getVal()})` : `None`
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
  COMPARE() {
    return [this.getStackVal(0), this.getStackVal(1)]
  },
  GT() {
    const [a, b] = this.getStackVal(0)
    return `${a} > ${b}`
  }
}



