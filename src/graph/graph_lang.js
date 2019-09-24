// @flow

/*
Graph lang sample:

contract abc123 {
  a -> b -> c
  b -> c [attr1=v1 attr2=v2]
  sd -> contract qqq {
    e -> w -> z
    vwef -> fe
  }
}

*/

import { createToken, Lexer, EmbeddedActionsParser } from 'chevrotain'

// Tokens definition
const WHITE_SPACE = createToken({name: 'WHITE_SPACE', pattern: /\s+/, group: Lexer.SKIPPED})
const IDENTIFIER = createToken({ name: 'IDENTIFIER', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/})
const CONTRACT = createToken({name: 'CONTRACT', pattern: /contract/})
const ARROW_RIGHT = createToken({ name: "ARROW_RIGHT", pattern: /->/})
const LEFT_BRACKET = createToken({ name: "LEFT_BRACKET", pattern: /\[/})
const RIGHT_BRACKET = createToken({ name: "RIGHT_BRACKET", pattern: /\]/})
const LEFT_CURLY_BRACKET = createToken({ name: "LEFT_CURLY_BRACKET", pattern: /{/})
const RIGHT_CURLY_BRACKET = createToken({ name: "RIGHT_CURLY_BRACKET", pattern: /}/ })
const EQUAL = createToken({ name: "EQUAL", pattern: /=/ })

const all_tokens = [
  WHITE_SPACE,
  CONTRACT,
  ARROW_RIGHT,
  LEFT_BRACKET,
  RIGHT_BRACKET,
  LEFT_CURLY_BRACKET,
  RIGHT_CURLY_BRACKET,
  EQUAL,
  IDENTIFIER
]

export class GLParser extends EmbeddedActionsParser {
  constructor() {
    super(all_tokens)

    this.setRules()
    this.performSelfAnalysis()
  }

  setRules() {
    const _ = this
    const fn = x => function(...args){return _[x].apply(_, args)}
    const rule = fn('RULE')
    const consume = fn('CONSUME')
    const consume1 = fn('CONSUME1')
    const subrule = fn('SUBRULE')
    const or = fn('OR')
    const option = fn('OPTION')
    const zero_or_more = fn('MANY')
    const one_or_more = fn('AT_LEAST_ONE')
    const zero_or_more_sep = fn('MANY_SEP')
    const one_or_more_sep = fn('AT_LEAST_ONE_SEP')

    // rules

    rule('attr_item_expr', () => {
      const name = consume(IDENTIFIER).image
      consume(EQUAL)
      const value = consume1(IDENTIFIER).image
      return {name, value}
    })

    rule('attr_expr', () => {
      consume(LEFT_BRACKET)
      const attrs = []
      one_or_more(() => {
        attrs.push(subrule(this.attr_item_expr))
      })
      consume(RIGHT_BRACKET)
      return attrs
    })

    rule('path_to_expr', () => {
      consume(ARROW_RIGHT)
      return or([
        {ALT: () => consume(IDENTIFIER).image},
        {ALT: () => subrule(this.contract_expr)}
      ])
    })

    rule('path_expr', () => {
      const group = []
      const nodes = [consume(IDENTIFIER).image]
      let attrs

      one_or_more(() => {
        nodes.push(subrule(this.path_to_expr))
      })

      option(() => {
        attrs = subrule(this.attr_expr)
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

    rule('contract_expr', () => {
      const paths = []
      consume(CONTRACT)
      const name = consume(IDENTIFIER).image
      consume(LEFT_CURLY_BRACKET)
      zero_or_more(() => {
        paths.push(subrule(this.path_expr))
      })
      consume(RIGHT_CURLY_BRACKET)
      return {
        contract: name,
        paths
      }
    })
  }

  parse(content : string) {
    const lexer = new Lexer(all_tokens)
    this.input = lexer.tokenize(content).tokens
    const output = this.contract_expr()
    if (this.errors.length)
      throw this.errors
    else
      return output
  }

}