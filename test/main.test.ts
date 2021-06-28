// tom-weatherhead/thaw-parser/test/main.test.ts

'use strict';

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

// test('LL(1) parser instance creation test - Scheme', () => {
// 	// Arrange
// 	const grammar = createGrammar(LanguageSelector.Scheme);
// 	const parser = createParser(ParserSelector.LL1, grammar);

// 	// Act
// 	// Assert
// 	expect(parser).toBeTruthy();
// });
