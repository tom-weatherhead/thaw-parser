// thaw-parser/test/test-grammars/grammar1.ts

'use strict';

// import { Stack } from 'thaw-common-utilities.ts';

import {
	GrammarSymbol,
	IToken,
	LexicalState,
	ParserSelector,
	SemanticStackType
} from 'thaw-interpreter-types';

// import {
// 	// createTokenizer,
// 	// LexicalAnalyzerSelector,
// 	LexicalState,
// 	Token
// } from 'thaw-lexical-analyzer';

import {
	// createGrammar,
	createProduction,
	GrammarBase,
	GrammarException // ,
	// LanguageSelector,
	// Production,
	// Symbol
} from 'thaw-grammar';

// import { createParser, ParserSelector } from '../..';

export class Grammar1 extends GrammarBase {
	// The "G1" grammar from Chapter 6 of Fischer and LeBlanc

	constructor() {
		super(GrammarSymbol.nonterminalStart);

		// Terminals:
		this.terminals.push(GrammarSymbol.terminalLeftBracket);
		this.terminals.push(GrammarSymbol.terminalRightBracket);
		this.terminals.push(GrammarSymbol.terminalID);
		this.terminals.push(GrammarSymbol.terminalPlus);
		this.terminals.push(GrammarSymbol.terminalEOF);

		this.nonTerminals.push(GrammarSymbol.nonterminalStart);
		this.nonTerminals.push(GrammarSymbol.nonterminalExpression);
		this.nonTerminals.push(GrammarSymbol.nonterminalPrimary); // Use nonterminalPrimary in place of the non-terminal T.

		// See Fischer and LeBlanc, page 152
		this.productions.push(
			createProduction(
				GrammarSymbol.nonterminalStart,
				[GrammarSymbol.nonterminalExpression, GrammarSymbol.terminalEOF],
				1
			)
		);
		this.productions.push(
			createProduction(
				GrammarSymbol.nonterminalExpression,
				[
					GrammarSymbol.nonterminalExpression,
					GrammarSymbol.terminalPlus,
					GrammarSymbol.nonterminalPrimary
				],
				2
			)
		);
		this.productions.push(
			createProduction(
				GrammarSymbol.nonterminalExpression,
				[GrammarSymbol.nonterminalPrimary],
				3
			)
		);
		this.productions.push(
			createProduction(GrammarSymbol.nonterminalPrimary, [GrammarSymbol.terminalID], 4)
		);
		this.productions.push(
			createProduction(
				GrammarSymbol.nonterminalPrimary,
				[
					GrammarSymbol.terminalLeftBracket,
					GrammarSymbol.nonterminalExpression,
					GrammarSymbol.terminalRightBracket
				],
				5
			)
		);
	}

	public get languageName(): string {
		return 'Grammar1';
	}

	public get selectorsOfCompatibleParsers(): ParserSelector[] {
		return [ParserSelector.LR0];
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */

	public executeSemanticAction(semanticStack: SemanticStackType, action: string): void {
		throw new Error('Grammar1.ExecuteSemanticAction()'); // NotImplementedException
	}

	public tokenToSymbol(token: IToken): GrammarSymbol {
		switch (token.tokenType) {
			case LexicalState.tokenLeftBracket:
				return GrammarSymbol.terminalLeftBracket;
			case LexicalState.tokenRightBracket:
				return GrammarSymbol.terminalRightBracket;
			case LexicalState.tokenIdent:
				return GrammarSymbol.terminalID;
			case LexicalState.tokenPlus:
				return GrammarSymbol.terminalPlus;
			case LexicalState.tokenEOF:
				return GrammarSymbol.terminalEOF;

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
		semanticStack: SemanticStackType,
		tokenAsSymbol: GrammarSymbol,
		token: IToken
	): void {
		throw new Error('Grammar1.PushTokenOntoSemanticStack()'); // NotImplementedException
	}

	/* eslint-enable @typescript-eslint/no-unused-vars */
}
