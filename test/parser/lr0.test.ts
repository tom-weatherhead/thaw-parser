// thaw-parser/test/parser/lr0.test.ts

'use strict';

import { LanguageSelector, LexicalAnalyzerSelector, ParserSelector } from 'thaw-interpreter-types';

import { createTokenizer } from 'thaw-lexical-analyzer';

import { createParser } from '../..';

import { Grammar1 } from '../test-grammars/grammar1';

test('LR(0) parser instance creation test', () => {
	// Arrange
	const grammar = new Grammar1();

	// Act
	const parser = createParser(ParserSelector.LR0, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

function grammar1RecognizeTest(input: string): void {
	// Arrange
	const grammar = new Grammar1();
	const tokenizer = createTokenizer(
		LexicalAnalyzerSelector.MidnightHack,
		LanguageSelector.Inference
	);
	const parser = createParser(ParserSelector.LR0, grammar);

	parser.recognize(tokenizer.tokenize(input));
}

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
