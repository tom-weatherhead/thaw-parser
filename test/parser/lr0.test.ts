// thaw-parser/test/parser/lr0.test.ts

'use strict';

import {
	createTokenizer,
	LexicalAnalyzerSelector
	// LexicalState,
	// Token
} from 'thaw-lexical-analyzer';

import {
	// createGrammar,
	// GrammarBase,
	// GrammarException,
	LanguageSelector // ,
	// Production,
	// Symbol
} from 'thaw-grammar';

import { createParser, ParserSelector } from '../..';

import { Grammar1 } from '../test-grammars/grammar1';

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
