// tom-weatherhead/thaw-parser/test/lambda-calculus.test.ts

'use strict';

import { createTokenizer, LexicalAnalyzerSelector } from 'thaw-lexical-analyzer';

import { createGrammar, ILCExpression, LanguageSelector } from 'thaw-grammar';

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
	// Arrange
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));

	f('x');
	f('λ x . x');
	f('(x y)');
	f('(λ x . x y)');

	expect(() => f('(x y')).toThrow(SyntaxException);
});

function getParseFunction(): (str: string) => ILCExpression {
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	return (str: string) => parser.parse(tokenizer.tokenize(str)) as ILCExpression;
}

test('LambdaCalculus parse test', () => {
	// Arrange
	const f = getParseFunction();

	expect(f('x')).toBeTruthy();
	expect(f('(x y)')).toBeTruthy();
	expect(f('λx.x')).toBeTruthy();
	expect(f('(λx.x y)')).toBeTruthy();
});

test('LambdaCalculus beta-reduction test 1', () => {
	// Arrange
	const f = getParseFunction();

	const expr = f('(λx.x y)');
	const reducedExpr = expr.betaReduce();

	expect(expr).toBeTruthy();
	expect(reducedExpr).toBeTruthy();

	const variableName = (reducedExpr as any).name;

	expect(variableName).toBeDefined();
	expect(variableName).toBe('y');
});
