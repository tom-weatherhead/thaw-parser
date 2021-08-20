// tom-weatherhead/thaw-parser/test/lambda-calculus.test.ts

// From https://opendsa.cs.vt.edu/ODSA/Books/PL/html/ChurchNumerals.html :

// TRUE = λx.λy.x
//
// FALSE = λx.λy.y
//
// AND = λp.λq.((pq) FALSE)
//
// OR = λp.λq.(((IF p) TRUE) q)
//
// IF = λb.λx.λy.((b x) y)
//
// To encode the non-negative integers, Church used the following encoding:
//
// ZERO = λf.λ x.x
//
// A successor function SUCC = λn.λf.λx.(f((nf)x))
//
// ONE = (SUCC ZERO) = λf.λ x.(fx)
//
// TWO = (SUCC ONE) = λf.λ x.(f(fx))
//
// THREE = (SUCC TWO) = λf.λ x.(f(f(fx)))
//
// FOUR = (SUCC THREE) = ???

// Addition and multiplication can be encoded as curried functions:
//
// PLUS = λm.λn.λf.λx.((nf)((mf)x))
//
// MULT = λm.λn.λf.(m(nf))
//
// We add a Church encoding for an operation that computes the predecessor of a Church numeral n:
//
// PRED = λn.λf.λx.(((nλg.λh.(h(gf)))λu.x)λu.u)
//
// And finally, we add an operation to test for zero, which can be used in the if-then-else you identified in the previous practice problem (see above).
//
// ISZERO = λn.((nλx.FALSE)TRUE)

'use strict';

import { createTokenizer, LexicalAnalyzerSelector } from 'thaw-lexical-analyzer';

import { createGrammar, ILCExpression, LanguageSelector } from 'thaw-grammar';

import { createParser, ParserSelector, SyntaxException } from '..';

const ls = LanguageSelector.LambdaCalculus;

// test('LambdaCalculus parser instance creation test', () => {
// 	// Arrange
// 	const grammar = createGrammar(ls);
//
// 	// Act
// 	const parser = createParser(ParserSelector.LL1, grammar);
//
// 	// Assert
// 	expect(parser).toBeTruthy();
// });
//
// test('LambdaCalculus recognize test', () => {
// 	// Arrange
// 	const grammar = createGrammar(ls);
// 	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	const parser = createParser(ParserSelector.LL1, grammar);
//
// 	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));
//
// 	// For a list of combinators, see https://github.com/loophp/combinator ,
// 	// all (?) of which can be implemented in terms of just S and K.
//
// 	f('x');
// 	f('λx.x'); // Combinator I (identity) === ((S K) K)
// 	f('λx.λy.x'); // Combinator K
// 	f('(x y)');
// 	f('(λx.x y)');
// 	// 'a => b => c => a(c)(b(c))'
// 	f('λa.λb.λc.((a c) (b c))'); // Combinator S
// 	f('λa.(λb.(a (b b)) λb.(a (b b)))'); // Combinator Y (fixed-point; used to implement recursion)
//
// 	expect(() => f('(x y')).toThrow(SyntaxException);
// });

function getParseFunction(): (str: string) => ILCExpression {
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	return (str: string) => parser.parse(tokenizer.tokenize(str)) as ILCExpression;
}

// test('LambdaCalculus parse test', () => {
// 	// Arrange
// 	const f = getParseFunction();
//
// 	expect(f('x')).toBeTruthy();
// 	expect(f('(x y)')).toBeTruthy();
// 	expect(f('λx.x')).toBeTruthy();
// 	expect(f('(λx.x y)')).toBeTruthy();
// });

function createVariableNameGenerator(): () => string {
	let n = 0;

	return () => `v${++n}`;
}

// test('LambdaCalculus Variable Name Generator test', () => {
// 	const generateNewVariableName = createVariableNameGenerator();
//
// 	expect(generateNewVariableName()).toBe('v1');
// 	expect(generateNewVariableName()).toBe('v2');
// 	expect(generateNewVariableName()).toBe('v3');
// });
//
// test('LambdaCalculus beta-reduction test 1', () => {
// 	// Arrange
// 	const generateNewVariableName = createVariableNameGenerator();
// 	const f = getParseFunction();
//
// 	const expr = f('(λx.x y)');
// 	const reducedExpr = expr.betaReduce(generateNewVariableName);
//
// 	expect(expr).toBeTruthy();
// 	expect(reducedExpr).toBeTruthy();
//
// 	const variableName = (reducedExpr as any).name;
//
// 	expect(variableName).toBeDefined();
// 	expect(variableName).toBe('y');
// });
//
// test('LambdaCalculus beta-reduction test 2', () => {
// 	// Arrange
// 	const generateNewVariableName = createVariableNameGenerator();
// 	const f = getParseFunction();
//
// 	const expr = f('(λf.λx.x g)');
//
// 	expect(expr).toBeTruthy();
//
// 	const reducedExpr = expr.betaReduce(generateNewVariableName);
//
// 	expect(reducedExpr).toBeTruthy();
// 	expect(reducedExpr.toString()).toBe('λx.x');
// });
//
// test('LambdaCalculus beta-reduction test 3', () => {
// 	// Arrange
// 	const generateNewVariableName = createVariableNameGenerator();
// 	const f = getParseFunction();
//
// 	const expr = f('((λf.λx.x g) h)');
//
// 	expect(expr).toBeTruthy();
//
// 	const reducedExpr = expr.betaReduce(generateNewVariableName);
//
// 	expect(reducedExpr).toBeTruthy();
// 	expect(reducedExpr.toString()).toBe('h');
// });

test('LambdaCalculus Church Numerals test 1', () => {
	// Arrange

	// To encode the non-negative integers, Church used the following encoding:
	//
	// ZERO = λf.λ x.x
	const strZero = 'λf.λx.x';
	//
	// A successor function SUCC = λn.λf.λx.(f((nf)x))
	const strSucc = 'λn.λf.λx.(f ((n f) x))';
	//
	// ONE = (SUCC ZERO) = λf.λ x.(fx)
	const strOneExpected1 = 'λf.λx.(f x)';
	const strOneExpected = 'λv1.λv2.(v1 v2)';
	const strOneSrc = `(${strSucc} ${strZero})`;
	//
	// TWO = (SUCC ONE) = λf.λ x.(f(fx))
	const strTwoExpected1 = 'λf.λx.(f (f x))';
	const strTwoExpected = 'λv3.λv4.(v3 (v3 v4))';
	const strTwoSrc = `(${strSucc} ${strOneExpected1})`;
	//
	// THREE = (SUCC TWO) = λf.λ x.(f(f(fx)))
	// const strThreeExpected1 = 'λf.λx.(f (f (f x)))';
	const strThreeExpected = 'λv5.λv6.(v5 (v5 (v5 v6)))';
	const strThreeSrc = `(${strSucc} ${strTwoExpected1})`;

	const generateNewVariableName = createVariableNameGenerator();
	const f = getParseFunction();

	// Act

	// const zero = f(strZero);
	// const succ = f(strSucc);
	const one = f(strOneSrc);
	const two = f(strTwoSrc);
	const three = f(strThreeSrc);

	const strOneActual = one.betaReduce(generateNewVariableName).toString();
	const strTwoActual = two.betaReduce(generateNewVariableName).toString();
	const strThreeActual = three.betaReduce(generateNewVariableName).toString();

	// Assert
	expect(strOneActual).toBe(strOneExpected);
	expect(strTwoActual).toBe(strTwoExpected);
	expect(strThreeActual).toBe(strThreeExpected);
});
