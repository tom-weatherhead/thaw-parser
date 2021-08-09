// thaw-parser/test/parser/lalr1.test.ts

'use strict';

import {
	createTokenizer,
	LexicalAnalyzerSelector
	// LexicalState,
	// Token
} from 'thaw-lexical-analyzer';

import {
	Chapter1GlobalInfo,
	createGrammar,
	// GrammarBase,
	// GrammarException,
	IExpression,
	LanguageSelector // ,
	// Production,
	// Symbol
} from 'thaw-grammar';

import { createParser, ParserSelector, SyntaxException } from '../..';

// import { Grammar1 } from '../test-grammars/grammar1';

test('LALR(1) parser instance creation test', () => {
	// Arrange
	// const ls = LanguageSelector.Scheme; // This works, but it takes about 30 seconds.
	const ls = LanguageSelector.Chapter1;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LALR1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

// test('LALR(1) recognize test', () => {
// 	// Arrange
// 	const ls = LanguageSelector.Chapter1;
// 	const grammar = createGrammar(ls);
// 	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	const parser = createParser(ParserSelector.LALR1, grammar);
//
// 	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));
//
// 	// f('pred1.');
//
// 	// expect(() => f('pred1(A.')).toThrow(ParserException);
//
// 	f('(* 7 13)');
//
// 	expect(() => f('(* 7 13')).toThrow(SyntaxException);
// });
//
// function lalr1ParserTest(data: Array<[input: string, expectedResult: string | string[]]>): void {
// 	// Arrange
// 	const ls = LanguageSelector.Chapter1;
// 	const globalInfo = new Chapter1GlobalInfo();
// 	const grammar = createGrammar(ls);
// 	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	const parser = createParser(ParserSelector.LALR1, grammar);
//
// 	for (const [input, expectedResult] of data) {
// 		// Act
// 		const parseResult = parser.parse(tokenizer.tokenize(input));
// 		const expr = parseResult as IExpression<number>;
// 		const actualResult = expr.evaluate(globalInfo.globalEnvironment, globalInfo).toString();
//
// 		// console.log(`input: ${input}\nactualResult:\n${actualResult}\n\n`);
//
// 		// Assert
// 		if (typeof expectedResult === 'string') {
// 			expect(actualResult).toBe(expectedResult);
// 		} else {
// 			for (const str of expectedResult) {
// 				expect(actualResult.includes(str)).toBe(true);
// 			}
// 		}
// 	}
// }

// test('LALR(1) Chapter1 addition test', () => {
// 	// Arrange
// 	lalr1ParserTest([['(+ 2 3)', '5']]);
// });
