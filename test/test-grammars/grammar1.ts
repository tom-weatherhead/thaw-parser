// thaw-parser/test/test-grammars/grammar1.ts

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

export class Grammar1 extends GrammarBase {
	// The "G1" grammar from Chapter 6 of Fischer and LeBlanc

	constructor() {
		super(Symbol.nonterminalStart);

		// Terminals:
		this.terminals.push(Symbol.terminalLeftBracket);
		this.terminals.push(Symbol.terminalRightBracket);
		this.terminals.push(Symbol.terminalID);
		this.terminals.push(Symbol.terminalPlus);
		this.terminals.push(Symbol.terminalEOF);

		this.nonTerminals.push(Symbol.nonterminalStart);
		this.nonTerminals.push(Symbol.nonterminalExpression);
		this.nonTerminals.push(Symbol.nonterminalPrimary); // Use nonterminalPrimary in place of the non-terminal T.

		// See Fischer and LeBlanc, page 152
		this.productions.push(
			new Production(Symbol.nonterminalStart, [Symbol.nonterminalExpression, Symbol.terminalEOF], 1)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalExpression,
				[Symbol.nonterminalExpression, Symbol.terminalPlus, Symbol.nonterminalPrimary],
				2
			)
		);
		this.productions.push(new Production(Symbol.nonterminalExpression, [Symbol.nonterminalPrimary], 3));
		this.productions.push(new Production(Symbol.nonterminalPrimary, [Symbol.terminalID], 4));
		this.productions.push(
			new Production(
				Symbol.nonterminalPrimary,
				[Symbol.terminalLeftBracket, Symbol.nonterminalExpression, Symbol.terminalRightBracket],
				5
			)
		);
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */

	public executeSemanticAction(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		semanticStack: Stack<any>,
		action: string
	): void {
		throw new Error('Grammar1.ExecuteSemanticAction()'); // NotImplementedException
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
			case LexicalState.tokenEOF:
				return Symbol.terminalEOF;

			default:
				throw new GrammarException(
					`No grammar symbol matches token ${token.tokenType} ${
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
		throw new Error('Grammar1.PushTokenOntoSemanticStack()'); // NotImplementedException
	}

	/* eslint-enable @typescript-eslint/no-unused-vars */
}

/* eslint-enable @typescript-eslint/ban-types */
