// src/parser-factory.ts

import { IGrammar, ParserSelector } from 'thaw-grammar';

import { ParserException } from './exceptions/parser-exception';
import { IParser } from './iparser';
import { LL1Parser } from './ll1-parser';
import { LR0Parser } from './lr0-parser';
import { SLR1Parser } from './slr1-parser';
// import { ParserSelector } from './parser-selectors';

export function createParser(ps: ParserSelector, g: IGrammar): IParser {
	switch (ps) {
		case ParserSelector.LL1:
			return new LL1Parser(g);

		case ParserSelector.LR0:
			return new LR0Parser(g);

		case ParserSelector.SLR1:
			return new SLR1Parser(g);

		// case ParserSelector.LR1:
		// case ParserSelector.LALR1:
		default:
			throw new ParserException(`createParser() : Unsupported ParserSelector '${ps}'`);
	}
}
