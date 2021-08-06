// tom-weatherhead/thaw-parser/test/sasl.test.ts

'use strict';

import { createTokenizer, LexicalAnalyzerSelector } from 'thaw-lexical-analyzer';

import {
	createGrammar,
	// IExpression,
	// ISExpression,
	LanguageSelector,
	SASLGlobalInfo
	// SchemeGlobalInfo
} from 'thaw-grammar';

import { createParser, ParserException, ParserSelector } from '..';

test('LL(1) SASL parser instance creation test', () => {
	// Arrange
	const ls = LanguageSelector.SASL;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) SASL recognize test', () => {
	// Arrange
	const ls = LanguageSelector.SASL;
	// const prologGlobalInfo = new PrologGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));

	// f('pred1.');

	// expect(() => f('pred1(A.')).toThrow(ParserException);

	f('(* 7 13)');

	expect(() => f('(* 7 13')).toThrow(ParserException);
});

function saslTest(data: Array<[input: string, expectedResult: string | string[]]>): void {
	// Arrange
	const ls = LanguageSelector.SASL;
	const saslGlobalInfo = new SASLGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	for (const [input, expectedResult] of data) {
		// Act
		const parseResult = parser.parse(tokenizer.tokenize(input));
		const expr = parseResult as IExpression<ISExpression>;
		const actualResult = expr
			.evaluate(saslGlobalInfo.globalEnvironment, saslGlobalInfo)
			.toString();

		// console.log(`input: ${input}\nactualResult:\n${actualResult}\n\n`);

		// Assert
		if (typeof expectedResult === 'string') {
			expect(actualResult).toBe(expectedResult);
		} else {
			for (const str of expectedResult) {
				expect(actualResult.includes(str)).toBe(true);
			}
		}
	}
}

test('LL(1) SASL addition test 1', () => {
	saslTest([['(+ 2 3)', '5']]);
});

//     Evaluate("(set force (lambda (x) (if (list? x) (if (force (car x)) (force (cdr x)) '()) 'T)))");    // Un-thunk x.
//     Evaluate("(set ints-from (lambda (i) (cons i (ints-from (+1 i)))))");
//     Evaluate("(set ints (ints-from 0))");

// public void InfiniteListTest()      // From Kamin, pages 160-161
// {
// 	Assert.AreEqual("(<thunk> <thunk>)", Evaluate("ints"));
// 	Assert.AreEqual("0", Evaluate("(car ints)"));
// 	Assert.AreEqual("(0 <thunk>)", Evaluate("ints"));
// 	Assert.AreEqual("1", Evaluate("(car (cdr ints))"));
// 	Assert.AreEqual("(0 1 <thunk>)", Evaluate("ints"));
// }

test('SASL infinite list test', () => {
	saslTest([
		['(set +1 (lambda (n) (+ n 1)))', '<closure>'],
		['(set ints-from (lambda (i) (cons i (ints-from (+1 i)))))', '<closure>'],
		['(set ints (ints-from 0))', '(<thunk> <thunk>)'],
		['ints', '(<thunk> <thunk>)'],
		['(car ints)', '0'],
		['ints', '(0 <thunk>)'],
		['(car (cdr ints))', '1'],
		['ints', '(0 (1 <thunk>))']
	]);
});
