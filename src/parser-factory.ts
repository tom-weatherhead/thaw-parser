// src/parser-factory.ts

// import { GrammarSymbol, IGrammar, IParser, IProduction, IToken } from 'thaw-interpreter-types';

import { IGrammar, IParser, ParserSelector } from 'thaw-interpreter-types';

import { ParserException } from './exceptions/parser';
// import { IParser } from './iparser';
import { LL1Parser } from './ll1-parser';
import { LR0Parser } from './lr0-parser';
import { LR1Parser } from './lr1-parser';
import { SLR1Parser } from './slr1-parser';
import { LALR1Parser } from './lalr1-parser';

export function createParser(ps: ParserSelector, g: IGrammar): IParser {
	switch (ps) {
		case ParserSelector.LL1:
			return new LL1Parser(g);

		case ParserSelector.LR0:
			return new LR0Parser(g);

		case ParserSelector.SLR1:
			return new SLR1Parser(g);

		case ParserSelector.LR1:
			return new LR1Parser(g);

		case ParserSelector.LALR1:
			return new LALR1Parser(g);

		default:
			throw new ParserException(`createParser() : Unsupported ParserSelector '${ps}'`);
	}
}
