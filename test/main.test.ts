// tom-weatherhead/thaw-parser/test/main.test.ts

'use strict';

import {
	createTokenizer,
	LexicalAnalyzerSelector
} from 'thaw-lexical-analyzer';

import {
	createGrammar,
	LanguageSelector,
	PrologGlobalInfo
} from 'thaw-grammar';

import { createParser, ParserSelector } from '..';

test('LL(1) parser instance creation test - MinimalLanguage', () => {
	// Arrange
	const grammar = createGrammar(LanguageSelector.MinimalLanguage);
	const parser = createParser(ParserSelector.LL1, grammar);

	// Act
	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) parser instance creation test - Chapter1', () => {
	// Arrange
	const grammar = createGrammar(LanguageSelector.Chapter1);
	const parser = createParser(ParserSelector.LL1, grammar);

	// Act
	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) parser instance creation test - LISP', () => {
	// Arrange
	const grammar = createGrammar(LanguageSelector.LISP);
	const parser = createParser(ParserSelector.LL1, grammar);

	// Act
	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) parser instance creation test - Scheme', () => {
	// Arrange
	const grammar = createGrammar(LanguageSelector.Scheme);
	const parser = createParser(ParserSelector.LL1, grammar);

	// Act
	// Assert
	expect(parser).toBeTruthy();
});

// **** Prolog ****

test('LL(1) parser instance creation test - Prolog', () => {
	// Arrange
	const ls = LanguageSelector.Prolog2;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

function prologTest(data: Array<[input: string, expectedResult: string]>): void {
	// Arrange
	const ls = LanguageSelector.Prolog2;
	const prologGlobalInfo = new PrologGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	for (const [input, expectedResult] of data) {
		// Act
		const actualResult = prologGlobalInfo.ProcessInput(parser.parse(tokenizer.tokenize(input)));

		// Assert
		expect(actualResult).toBe(expectedResult);
	}
}

// test('LL(1) Prolog interpret test 1', () => {
// 	// Arrange
// 	const ls = LanguageSelector.Prolog2;
// 	const prologGlobalInfo = new PrologGlobalInfo();
// 	const grammar = createGrammar(ls);
// 	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	const parser = createParser(ParserSelector.LL1, grammar);

// 	const input1 = 'pred1.';
// 	const input2 = '?- pred1.';
// 	// const listOfTokens = tokenizer.tokenize(inputString);
// 	// const parseResult = parser.parse(listOfTokens);

// 	// console.log(
// 	// 	`thaw-parser: Prolog test: parseResult of '${inputString}' is:`,
// 	// 	typeof parseResult,
// 	// 	parseResult
// 	// );

// 	// Act
// 	// Assert
// 	expect(
// 		prologGlobalInfo.ProcessInput(parser.parse(tokenizer.tokenize(input1)))
// 	).toBe(PrologGlobalInfo.ClauseAdded);
// 	expect(
// 		prologGlobalInfo.ProcessInput(parser.parse(tokenizer.tokenize(input2)))
// 	).toBe(PrologGlobalInfo.Satisfied);
// });

test('LL(1) Prolog interpret test 1', () => {
	prologTest([
		// ['', PrologGlobalInfo.],
		['pred1.', PrologGlobalInfo.ClauseAdded],
		['?- pred1.', PrologGlobalInfo.Satisfied]
	]);
});
