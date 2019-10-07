// @flow

import { createToken, Lexer } from 'chevrotain'

// Tokens definition
const WHITE_SPACE = createToken({name: 'WHITE_SPACE', pattern: /\s+/, group: Lexer.SKIPPED})
const IDENTIFIER = createToken({ name: 'IDENTIFIER', pattern: /[a-zA-Z_][a-zA-Z0-9_':]*|".*?"/})
const CONTRACT = createToken({name: 'CONTRACT', pattern: /contract/})
const ARROW_RIGHT = createToken({ name: "ARROW_RIGHT", pattern: /->|-.+?->/})
const LEFT_BRACKET = createToken({ name: "LEFT_BRACKET", pattern: /\[/})
const RIGHT_BRACKET = createToken({ name: "RIGHT_BRACKET", pattern: /\]/})
const LEFT_CURLY_BRACKET = createToken({ name: "LEFT_CURLY_BRACKET", pattern: /{/})
const RIGHT_CURLY_BRACKET = createToken({ name: "RIGHT_CURLY_BRACKET", pattern: /}/ })
const EQUAL = createToken({ name: "EQUAL", pattern: /=/ })

export const tokens = {
  WHITE_SPACE,
  CONTRACT,
  ARROW_RIGHT,
  LEFT_BRACKET,
  RIGHT_BRACKET,
  LEFT_CURLY_BRACKET,
  RIGHT_CURLY_BRACKET,
  EQUAL,
  IDENTIFIER
}