// tom-weatherhead/thaw-parser/test/scheme.test.ts

'use strict';

import { createTokenizer, LexicalAnalyzerSelector } from 'thaw-lexical-analyzer';

import { createGrammar, IExpression, ISExpression, LanguageSelector, SchemeGlobalInfo } from 'thaw-grammar';

import { createParser, ParserException, ParserSelector } from '..';

test('LL(1) Scheme parser instance creation test', () => {
	// Arrange
	const ls = LanguageSelector.Scheme;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) Scheme recognize test', () => {
	// 	// Arrange
	const ls = LanguageSelector.Scheme;
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

function schemeTest(data: Array<[input: string, expectedResult: string | string[]]>): void {
	// Arrange
	const ls = LanguageSelector.Scheme;
	const schemeGlobalInfo = new SchemeGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	for (const [input, expectedResult] of data) {
		// Act
		const parseResult = parser.parse(tokenizer.tokenize(input));
		const expr = parseResult as IExpression<ISExpression>;
		const actualResult = expr.evaluate(schemeGlobalInfo.globalEnvironment, schemeGlobalInfo).toString();

		console.log(`input: ${input}\nactualResult:\n${actualResult}\n\n`);

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

test('LL(1) Scheme addition test 1', () => {
	schemeTest([['(+ 2 3)', '5']]);
});
