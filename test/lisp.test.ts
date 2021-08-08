// tom-weatherhead/thaw-parser/test/lisp.test.ts

'use strict';

import { createTokenizer, LexicalAnalyzerSelector } from 'thaw-lexical-analyzer';

import {
	createGrammar,
	IExpression,
	ISExpression,
	LanguageSelector,
	LISPGlobalInfo
} from 'thaw-grammar';

import { createParser, ParserException, ParserSelector } from '..';

test('LL(1) LISP parser instance creation test', () => {
	// Arrange
	const ls = LanguageSelector.LISP;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) LISP recognize test', () => {
	// 	// Arrange
	const ls = LanguageSelector.LISP;
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));

	// f('pred1.');

	// expect(() => f('pred1(A.')).toThrow(ParserException);

	f('(* 7 13)');

	expect(() => f('(* 7 13')).toThrow(ParserException);
});

function lispTest(data: Array<[input: string, expectedResult: string | string[]]>): void {
	// Arrange
	const ls = LanguageSelector.LISP;
	const schemeGlobalInfo = new LISPGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	for (const [input, expectedResult] of data) {
		// Act
		const parseResult = parser.parse(tokenizer.tokenize(input));
		const expr = parseResult as IExpression<ISExpression>;
		const actualResult = expr
			.evaluate(schemeGlobalInfo.globalEnvironment, schemeGlobalInfo)
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

test('LL(1) LISP addition test 1', () => {
	lispTest([['(+ 2 3)', '5']]);
});
