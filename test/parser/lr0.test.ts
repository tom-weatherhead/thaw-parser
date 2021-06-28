// thaw-parser/test/parser/lr0.test.ts

'use strict';

import { Stack } from 'thaw-common-utilities.ts';

import {
	createTokenizer,
	LexicalAnalyzerSelector,
	LexicalState,
	Token
} from 'thaw-lexical-analyzer';

import {
	// createGrammar,
	GrammarBase,
	GrammarException,
	LanguageSelector,
	Production,
	Symbol
} from 'thaw-grammar';

import { createParser, ParserSelector } from '../..';

/* eslint-disable @typescript-eslint/ban-types */

class Grammar1 extends GrammarBase {
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
			new Production(
				Symbol.nonterminalStart,
				[Symbol.nonterminalExpression, Symbol.terminalEOF],
				1
			)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalExpression,
				[
					Symbol.nonterminalExpression,
					Symbol.terminalPlus,
					Symbol.nonterminalPrimary
				],
				2
			)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalExpression,
				[Symbol.nonterminalPrimary],
				3
			)
		);
		this.productions.push(
			new Production(Symbol.nonterminalPrimary, [Symbol.terminalID], 4)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalPrimary,
				[
					Symbol.terminalLeftBracket,
					Symbol.nonterminalExpression,
					Symbol.terminalRightBracket
				],
				5
			)
		);
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */

	public executeSemanticAction(
		semanticStack: Stack<object>,
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
		semanticStack: Stack<object>,
		tokenAsSymbol: Symbol,
		token: Token
	): void {
		throw new Error('Grammar1.PushTokenOntoSemanticStack()'); // NotImplementedException
	}

	/* eslint-enable @typescript-eslint/no-unused-vars */
}

/* eslint-enable @typescript-eslint/ban-types */

test('LR(0) parser instance creation test', () => {
	// Arrange
	// const ls = LanguageSelector.Scheme;
	const grammar = new Grammar1(); // createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LR0, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

function grammar1RecognizeTest(
	// data: Array<[input: string, expectedResult: string | string[]]>
	input: string
): void {
	// Arrange
	// const ls = LanguageSelector.Scheme;
	// const schemeGlobalInfo = new SchemeGlobalInfo();
	const grammar = new Grammar1();
	const tokenizer = createTokenizer(
		LexicalAnalyzerSelector.MidnightHack,
		LanguageSelector.Inference
	);
	const parser = createParser(ParserSelector.LR0, grammar);

	parser.recognize(tokenizer.tokenize(input));

	// for (const [input, expectedResult] of data) {
	// 	// Act
	// 	const parseResult = parser.recognize(tokenizer.tokenize(input));
	// 	const expr = parseResult as IExpression<ISExpression>;
	// 	const actualResult = expr
	// 		.evaluate(schemeGlobalInfo.globalEnvironment, schemeGlobalInfo)
	// 		.toString();

	// 	console.log(`input: ${input}\nactualResult:\n${actualResult}\n\n`);

	// 	// Assert
	// 	if (typeof expectedResult === 'string') {
	// 		expect(actualResult).toBe(expectedResult);
	// 	} else {
	// 		for (const str of expectedResult) {
	// 			expect(actualResult.includes(str)).toBe(true);
	// 		}
	// 	}
	// }
}

// [Test]
// public void RecognizeTest1() {
test('LR(0) Grammar1 recognize test 1', () => {
	grammar1RecognizeTest('a');
});

test('LR(0) Grammar1 recognize test 2', () => {
	grammar1RecognizeTest('(a + b) + (c + d)');
});

test('LR(0) Grammar1 recognize error test 1', () => {
	expect(() => grammar1RecognizeTest('a +')).toThrow();
});

test('LR(0) Grammar1 recognize error test 2', () => {
	expect(() => grammar1RecognizeTest('a b')).toThrow();
});
