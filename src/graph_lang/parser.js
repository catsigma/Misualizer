// @flow

import { Lexer, EmbeddedActionsParser } from 'chevrotain'
import { tokens } from './lexer'

export class Parser extends EmbeddedActionsParser {
  constructor() {
    super(Object.values(tokens))

    this.setRules()
    this.performSelfAnalysis()
  }

  setRules() {
    this.RULE('attr_item_expr', () => {
      const name = this.CONSUME(tokens.IDENTIFIER).image
      this.CONSUME(tokens.EQUAL)
      const value = this.CONSUME1(tokens.IDENTIFIER).image
      return {name, value}
    })

    this.RULE('attr_expr', () => {
      this.CONSUME(tokens.LEFT_BRACKET)
      const attrs = []
      this.AT_LEAST_ONE(() => {
        attrs.push(this.SUBRULE(this.attr_item_expr))
      })
      this.CONSUME(tokens.RIGHT_BRACKET)
      return attrs
    })

    this.RULE('path_to_expr', () => {
      this.CONSUME(tokens.ARROW_RIGHT)
      return this.OR([
        {ALT: () => this.CONSUME(tokens.IDENTIFIER).image},
        {ALT: () => this.SUBRULE(this.contract_expr)}
      ])
    })

    this.RULE('path_expr', () => {
      const group = []
      const nodes = [this.CONSUME(tokens.IDENTIFIER).image]
      let attrs

      this.AT_LEAST_ONE(() => {
        nodes.push(this.SUBRULE(this.path_to_expr))
      })

      this.OPTION(() => {
        attrs = this.SUBRULE(this.attr_expr)
      })

      nodes.forEach((node, i) => {
        if (i)
          group.push([nodes[i - 1], node])
      })

      return {
        group,
        attrs
      }
    })

    this.RULE('contract_expr', () => {
      const paths = []
      this.CONSUME(tokens.CONTRACT)
      const name = this.CONSUME(tokens.IDENTIFIER).image
      this.CONSUME(tokens.LEFT_CURLY_BRACKET)
      this.MANY(() => {
        paths.push(this.SUBRULE(this.path_expr))
      })
      this.CONSUME(tokens.RIGHT_CURLY_BRACKET)
      return {
        contract: name,
        paths
      }
    })
  }

  parse(content : string) {
    const lexer = new Lexer(Object.values(tokens))
    this.input = lexer.tokenize(content).tokens
    const output = this.contract_expr()
    if (this.errors.length)
      throw this.errors
    else
      return output
  }

}