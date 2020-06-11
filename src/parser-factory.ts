// src/parser-factory.ts

import { IGrammar, ParserSelector } from 'thaw-grammar';

import { ParserException } from './exceptions/parser-exception';
import { IParser } from './iparser';
import { LL1Parser } from './ll1-parser';
// import { ParserSelector } from './parser-selectors';

export function createParser(ps: ParserSelector, g: IGrammar): IParser {
	switch (ps) {
		case ParserSelector.LL1:
			return new LL1Parser(g);

		// case ParserSelector.LL1:
		// case ParserSelector.LRO:
		// case ParserSelector.LR1:
		// case ParserSelector.SLR1:
		// case ParserSelector.LALR1:
		default:
			throw new ParserException(
				`createParser() : Unsupported ParserSelector '${ps}'`
			);
	}
}
