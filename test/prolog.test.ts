// tom-weatherhead/thaw-parser/test/prolog.test.ts

'use strict';

import {
	createTokenizer,
	LexicalAnalyzerSelector
} from 'thaw-lexical-analyzer';

import {
	createGrammar,
	LanguageSelector,
	PrologGlobalInfo
} from 'thaw-grammar';

import { createParser, ParserSelector } from '..';

test('LL(1) parser instance creation test - Prolog', () => {
	// Arrange
	const ls = LanguageSelector.Prolog2;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

function prologTest(
	data: Array<[input: string, expectedResult: string | string[]]>
): void {
	// Arrange
	const ls = LanguageSelector.Prolog2;
	const prologGlobalInfo = new PrologGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	for (const [input, expectedResult] of data) {
		// Act
		const actualResult = prologGlobalInfo.ProcessInput(
			parser.parse(tokenizer.tokenize(input))
		);

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

function getSatisfied(sub = ''): string {
	return `Satisfying substitution is: [${sub}]\n${PrologGlobalInfo.Satisfied}`;
}

test('LL(1) Prolog interpret test 1', () => {
	prologTest([
		// ['', PrologGlobalInfo.],
		['pred1.', PrologGlobalInfo.ClauseAdded],
		['?- pred1.', getSatisfied()]
	]);
});

test('LL(1) Prolog interpret test 2', () => {
	prologTest([
		['foo :- bar, baz.', PrologGlobalInfo.ClauseAdded],
		['bar.', PrologGlobalInfo.ClauseAdded],
		['baz.', PrologGlobalInfo.ClauseAdded],
		['?- foo.', getSatisfied()]
	]);
});

test('LL(1) Prolog interpret test 3', () => {
	prologTest([
		['pred(V).', PrologGlobalInfo.ClauseAdded],
		['?- pred(1337).', getSatisfied('V -> 1337')]
	]);
});

test('LL(1) Prolog append test 1', () => {
	prologTest([
		['append([], L, L).', PrologGlobalInfo.ClauseAdded],
		[
			'append([X | Y], L, [X | Z]) :- append(Y, L, Z).',
			PrologGlobalInfo.ClauseAdded
		],
		['?- append([], [1], A).', ['Satisfied', 'A -> [1]']], // Y
		['?- append([1], [2], A).', ['Satisfied', 'A -> [1, 2]']], // Y
		['?- append([1], [3, 4], A).', ['Satisfied', 'A -> [1, 3, 4]']], // Y
		['?- append([1, 2], [3], A).', ['Satisfied', 'A -> [1, 2, 3]']], // N
		['?- append([1, 2], [3, 4], A).', ['Satisfied', 'A -> [1, 2, 3, 4]']] // N
	]);
});
