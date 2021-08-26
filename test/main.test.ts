// tom-weatherhead/thaw-parser/test/main.test.ts

'use strict';

// import {
// 	LanguageSelector,
// 	// LexicalAnalyzerSelector,
// 	ParserSelector
// } from 'thaw-interpreter-types';
//
// import { createGrammar } from 'thaw-grammar';
//
// import { createParser } from '..';

test('Main bogus test', () => {
	expect(true).toBeTruthy();
});

// **** LL(1) Parser Tests ****

// test('LL(1) parser instance creation test - MinimalLanguage', () => {
// 	// Arrange
// 	const grammar = createGrammar(LanguageSelector.MinimalLanguage);
// 	const parser = createParser(ParserSelector.LL1, grammar);
//
// 	// Act
// 	// Assert
// 	expect(parser).toBeTruthy();
// });
//
// test('LL(1) parser instance creation test - Chapter1', () => {
// 	// Arrange
// 	const grammar = createGrammar(LanguageSelector.Chapter1);
// 	const parser = createParser(ParserSelector.LL1, grammar);
//
// 	// Act
// 	// Assert
// 	expect(parser).toBeTruthy();
// });
//
// test('LL(1) parser instance creation test - LISP', () => {
// 	// Arrange
// 	const grammar = createGrammar(LanguageSelector.LISP);
// 	const parser = createParser(ParserSelector.LL1, grammar);
//
// 	// Act
// 	// Assert
// 	expect(parser).toBeTruthy();
// });

// ****

// test('LL(1) parser instance creation test - Scheme', () => {
// 	// Arrange
// 	const grammar = createGrammar(LanguageSelector.Scheme);
// 	const parser = createParser(ParserSelector.LL1, grammar);

// 	// Act
// 	// Assert
// 	expect(parser).toBeTruthy();
// });

// **** LR(0) Parser Tests ****

// test('LR(0) parser instance creation test - MinimalLanguage', () => {
// 	// Arrange
// 	const grammar = createGrammar(LanguageSelector.MinimalLanguage);
// 	const parser = createParser(ParserSelector.LR0, grammar);

// 	// Act
// 	// Assert
// 	expect(parser).toBeTruthy();
// });

// **** SLR(1) Parser Tests ****

// test('SLR(1) parser instance creation test - MinimalLanguage', () => {
// 	// Arrange
// 	const grammar = createGrammar(LanguageSelector.MinimalLanguage);
// 	const parser = createParser(ParserSelector.SLR1, grammar);

// 	// Act
// 	// Assert
// 	expect(parser).toBeTruthy();
// });
