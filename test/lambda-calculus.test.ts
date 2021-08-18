// tom-weatherhead/thaw-parser/test/lambda-calculus.test.ts

'use strict';

import { createTokenizer, LexicalAnalyzerSelector } from 'thaw-lexical-analyzer';

import { createGrammar, LanguageSelector } from 'thaw-grammar';

import { createParser, ParserSelector, SyntaxException } from '..';

const ls = LanguageSelector.LambdaCalculus;

test('LambdaCalculus parser instance creation test', () => {
	// Arrange
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

test('LambdaCalculus recognize test', () => {
	// 	// Arrange
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));

	f('x');
	f('λx.x');
	f('(x y)');
	f('(λx.x y)');

	expect(() => f('(x y')).toThrow(SyntaxException);
});
