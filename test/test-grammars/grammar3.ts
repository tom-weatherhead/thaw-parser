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

import {
	GrammarSymbol,
	IToken,
	LexicalState,
	ParserSelector,
	SemanticStackType
} from 'thaw-interpreter-types';

import { createProduction, GrammarBase, GrammarException } from 'thaw-interpreter-core';

export class Grammar3 extends GrammarBase {
	constructor() {
		super(GrammarSymbol.nonterminalStart);

		// Terminals:
		this.terminals.push(GrammarSymbol.terminalLeftBracket);
		this.terminals.push(GrammarSymbol.terminalRightBracket);
		this.terminals.push(GrammarSymbol.terminalID);
		this.terminals.push(GrammarSymbol.terminalPlus);
		this.terminals.push(GrammarSymbol.terminalMultiply);
		this.terminals.push(GrammarSymbol.terminalEOF);

		this.nonTerminals.push(GrammarSymbol.nonterminalStart);
		this.nonTerminals.push(GrammarSymbol.nonterminalExpression);
		this.nonTerminals.push(GrammarSymbol.nonterminalTerm);
		this.nonTerminals.push(GrammarSymbol.nonterminalPrimary);

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
					GrammarSymbol.nonterminalTerm
				],
				2
			)
		);
		this.productions.push(
			createProduction(
				GrammarSymbol.nonterminalExpression,
				[GrammarSymbol.nonterminalTerm],
				3
			)
		);
		this.productions.push(
			createProduction(
				GrammarSymbol.nonterminalTerm,
				[
					GrammarSymbol.nonterminalTerm,
					GrammarSymbol.terminalMultiply,
					GrammarSymbol.nonterminalPrimary
				],
				4
			)
		);
		this.productions.push(
			createProduction(GrammarSymbol.nonterminalTerm, [GrammarSymbol.nonterminalPrimary], 5)
		);
		this.productions.push(
			createProduction(GrammarSymbol.nonterminalPrimary, [GrammarSymbol.terminalID], 6)
		);
		this.productions.push(
			createProduction(
				GrammarSymbol.nonterminalPrimary,
				[
					GrammarSymbol.terminalLeftBracket,
					GrammarSymbol.nonterminalExpression,
					GrammarSymbol.terminalRightBracket
				],
				7
			)
		);
	}

	public get languageName(): string {
		return 'Grammar3';
	}

	public get selectorsOfCompatibleParsers(): ParserSelector[] {
		return [ParserSelector.SLR1];
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */

	public executeSemanticAction(semanticStack: SemanticStackType, action: string): void {
		throw new Error('Grammar3.ExecuteSemanticAction()'); // NotImplementedException
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
			case LexicalState.tokenMult:
				return GrammarSymbol.terminalMultiply;
			case LexicalState.tokenEOF:
				return GrammarSymbol.terminalEOF;

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
		semanticStack: SemanticStackType,
		tokenAsSymbol: GrammarSymbol,
		token: IToken
	): void {
		throw new Error('Grammar3.PushTokenOntoSemanticStack()'); // NotImplementedException
	}

	/* eslint-enable @typescript-eslint/no-unused-vars */
}
