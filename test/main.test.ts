// tom-weatherhead/thaw-parser/test/main.test.ts

'use strict';

import {
	createTokenizer,
	LexicalAnalyzerSelector
} from 'thaw-lexical-analyzer';

import { createGrammar, LanguageSelector } from 'thaw-grammar';

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

test('LL(1) parser instance creation test - Prolog', () => {
	// Arrange
	const ls = LanguageSelector.Prolog2;
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	const inputString = 'pred1.';
	const listOfTokens = tokenizer.tokenize(inputString);
	const parseResult = parser.parse(listOfTokens);

	console.log(
		`thaw-parser: Prolog test: parseResult of '${inputString}' is:`,
		typeof parseResult,
		parseResult
	);

	// Act
	// Assert
	expect(parser).toBeTruthy();
	expect(parseResult).toBeTruthy();
});
