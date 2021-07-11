// thaw-parser/test/test-grammars/grammar3.ts

// Grammar 3 (from Fischer and LeBlanc page 158)
// Grammar 3 is both LR(1) and SLR(1) (see page 165)
// S -> E $
// E -> E + T | T
// T -> T * P | P
// P -> ID | ( E )

// Grammar 4 (from Fischer and LeBlanc page 165)
// Grammar 3 is LR(1) but not SLR(1)
// Elem -> ( List , Elem )
// Elem -> Scalar
// List -> List , Elem
// List -> Elem
// Scalar -> ID
// Scalar -> ( Scalar )

'use strict';

import { Stack } from 'thaw-common-utilities.ts';

import {
	// createTokenizer,
	// LexicalAnalyzerSelector,
	LexicalState,
	Token
} from 'thaw-lexical-analyzer';

import {
	// createGrammar,
	GrammarBase,
	GrammarException,
	// LanguageSelector,
	Production,
	Symbol
} from 'thaw-grammar';

// import { createParser, ParserSelector } from '../..';

/* eslint-disable @typescript-eslint/ban-types */

export class Grammar3 extends GrammarBase {
	constructor() {
		super(Symbol.nonterminalStart);

		// Terminals:
		this.terminals.push(Symbol.terminalLeftBracket);
		this.terminals.push(Symbol.terminalRightBracket);
		this.terminals.push(Symbol.terminalID);
		this.terminals.push(Symbol.terminalPlus);
		this.terminals.push(Symbol.terminalMultiply);
		this.terminals.push(Symbol.terminalEOF);

		this.nonTerminals.push(Symbol.nonterminalStart);
		this.nonTerminals.push(Symbol.nonterminalExpression);
		this.nonTerminals.push(Symbol.nonterminalTerm);
		this.nonTerminals.push(Symbol.nonterminalPrimary);

		// this.productions.push(
		// 	new Production(
		// 		Symbol.nonterminalExpression,
		// 		[Symbol.nonterminalPrimary],
		// 		3
		// 	)
		// );
		// this.productions.push(
		// 	new Production(
		// 		Symbol.nonterminalPrimary,
		// 		[Symbol.terminalID],
		// 		2
		// 	)
		// );

		// See Fischer and LeBlanc, page 158
		this.productions.push(
			new Production(
				Symbol.nonterminalStart,
				[Symbol.nonterminalExpression, Symbol.terminalEOF],
				1
			)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalExpression,
				[Symbol.nonterminalExpression, Symbol.terminalPlus, Symbol.nonterminalTerm],
				2
			)
		);
		this.productions.push(
			new Production(Symbol.nonterminalExpression, [Symbol.nonterminalTerm], 3)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalTerm,
				[Symbol.nonterminalTerm, Symbol.terminalMultiply, Symbol.nonterminalPrimary],
				4
			)
		);
		this.productions.push(
			new Production(Symbol.nonterminalTerm, [Symbol.nonterminalPrimary], 5)
		);
		this.productions.push(new Production(Symbol.nonterminalPrimary, [Symbol.terminalID], 6));
		this.productions.push(
			new Production(
				Symbol.nonterminalPrimary,
				[
					Symbol.terminalLeftBracket,
					Symbol.nonterminalExpression,
					Symbol.terminalRightBracket
				],
				7
			)
		);
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */

	public executeSemanticAction(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		semanticStack: Stack<any>,
		action: string
	): void {
		throw new Error('Grammar3.ExecuteSemanticAction()'); // NotImplementedException
	}

	public tokenToSymbol(token: Token): Symbol {
		switch (token.tokenType) {
			case LexicalState.tokenLeftBracket:
				return Symbol.terminalLeftBracket;
			case LexicalState.tokenRightBracket:
				return Symbol.terminalRightBracket;
			case LexicalState.tokenIdent:
				return Symbol.terminalID;
			case LexicalState.tokenPlus:
				return Symbol.terminalPlus;
			case LexicalState.tokenMult:
				return Symbol.terminalMultiply;
			case LexicalState.tokenEOF:
				return Symbol.terminalEOF;

			default:
				throw new GrammarException(
					`Grammar3: No grammar symbol matches token ${token.tokenType} ${
						LexicalState[token.tokenType]
					} (value '${token.tokenValue}')`,
					token.line,
					token.column
				);
		}
	}

	public pushTokenOntoSemanticStack(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		semanticStack: Stack<any>,
		tokenAsSymbol: Symbol,
		token: Token
	): void {
		throw new Error('Grammar3.PushTokenOntoSemanticStack()'); // NotImplementedException
	}

	/* eslint-enable @typescript-eslint/no-unused-vars */
}
