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

import { createParser, ParserException, ParserSelector } from '..';

test('LL(1) parser instance creation test - Prolog', () => {
	// Arrange
	const ls = LanguageSelector.Prolog2;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) mini-Prolog recognize test', () => {
	// 	// Arrange
	const ls = LanguageSelector.Prolog2;
	// const prologGlobalInfo = new PrologGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));

	// expect(f('')).toBeTruthy();
	f('pred1.');
	f('pred1(A).');
	f('pred1(A, B, C).');
	f('pred1(A) :- pred2(A).');

	f('accRev(cons(H, T), A, R):-  accRev(T, cons(H, A), R).');
	f('accRev(nil, A, A).');
	f('?- accRev(cons(1, cons(2, nil)), nil, R).');

	f('pred1([]).');
	f('pred1([1]).');
	f('pred1([1, 2]).');
	f('pred1([1, 2, 3]).');
	f('pred1([1 | [2, 3]]).');

	f('unique_list([X|L]) :- \\+ member(X, L), unique_list(L).');

	expect(() => f('pred1(A.')).toThrow(ParserException);
});

function prologTest(
	data: Array<[input: string, expectedResult: string | string[]]>,
	allMode = false
): void {
	// Arrange
	const ls = LanguageSelector.Prolog2;
	const prologGlobalInfo = new PrologGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	if (allMode) {
		prologGlobalInfo.FindAllSolutions();
	}

	for (const [input, expectedResult] of data) {
		// Act
		const actualResult = prologGlobalInfo.ProcessInput(
			parser.parse(tokenizer.tokenize(input))
		);

		console.log(`input: ${input}\nactualResult: ${actualResult}\n\n`);

		// Assert
		if (typeof expectedResult === 'string') {
			expect(actualResult).toBe(expectedResult);
		} else {
			for (const str of expectedResult) {
				expect(actualResult.includes(str)).toBe(true);
			}
		}
	}

	console.log('allMode is', allMode);

	if (allMode) {
		console.log(
			'prologGlobalInfo.getPrintedText() :',
			prologGlobalInfo.getPrintedText()
		);
	}
}

test('LL(1) mini-Prolog list reverse test', () => {
	prologTest([
		[
			'accRev(cons(H, T), A, R):-  accRev(T, cons(H, A), R).',
			PrologGlobalInfo.ClauseAdded
		],
		['accRev(nil, A, A).', PrologGlobalInfo.ClauseAdded],
		['?- accRev(nil, nil, R).', ['Satisfied']],
		['?- accRev(cons(1, cons(2, nil)), nil, R).', ['Satisfied']],
		[
			'?- accRev(cons(1, cons(2, cons(3, nil))), nil, R).',
			[
				'Satisfying substitution is: [R -> cons(3, cons(2, cons(1, nil)))]',
				'Satisfied'
			]
		],
		[
			'?- accRev(cons(1, cons(2, cons(3, cons(4, nil)))), nil, R).',
			[
				'Satisfying substitution is: [R -> cons(4, cons(3, cons(2, cons(1, nil))))]',
				'Satisfied'
			]
		]
	]);
});

// function getSatisfied(sub = ''): string {
// 	return `Satisfying substitution is: [${sub}]\n${PrologGlobalInfo.Satisfied}`;
// }

// function explodingCast<T>(value: unknown): T {
// 	const castValue = value as T;

// 	if (castValue.constructor.name !== T.name) {
// 		// if (!(castValue instanceof T)) {
// 		throw new Error(`explodingCast() : ${value} -> ${castValue}`);
// 	}

// 	return castValue;
// }

// test('LL(1) Prolog unification test 1', () => {
// 	// Arrange
// 	const ls = LanguageSelector.Prolog2;
// 	const prologGlobalInfo = new PrologGlobalInfo();
// 	const grammar = createGrammar(ls);
// 	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	const parser = createParser(ParserSelector.LL1, grammar);

// 	const tpc = <T>(str: string): T =>
// 		explodingCast<T>(
// 			prologGlobalInfo.ProcessInput(parser.parse(tokenizer.tokenize(str)))
// 		);

// 	// const x = new PrologVariable('X');
// 	// 	const clause1 = (PrologClause)parser.Parse(tokenizer.Tokenize("baz(Z) :- assert((foo(Z) :- bat(Z)))."));
// 	// 	const clause2 = (PrologClause)parser.Parse(tokenizer.Tokenize("foo(Y) :- not(bar(Y))."));
// 	// 	const clause3 = (PrologClause)parser.Parse(tokenizer.Tokenize("foo([1,2,3])."));
// 	// 	const clause4 = (PrologClause)parser.Parse(tokenizer.Tokenize("baz(7) :- assert((foo(7) :- bat(7)))."));
// 	// 	const clause5 = (PrologClause)parser.Parse(tokenizer.Tokenize("foo(13) :- not(bar(13))."));
// 	// 	const goal = clause2.Lhs;
// 	// 	const goalWithInnerGoal = clause2.Rhs[0];
// 	// 	const goalWithInnerClause = clause1.Rhs[0];
// 	// 	const functorExpression = clause3.Lhs.ExpressionList[0];

// 	// 	expect(x.Unify(functorExpression)).toBeTruthy();
// 	// 	expect(functorExpression.Unify(x)).toBeTruthy();
// 	// 	expect(x.Unify(goal)).toBeFalsy();
// 	// 	expect(goal.Unify(x)).toBeFalsy();
// 	// 	expect(x.Unify(goalWithInnerGoal)).toBeFalsy();
// 	// 	expect(goalWithInnerGoal.Unify(x)).toBeFalsy();
// 	// 	expect(x.Unify(goalWithInnerClause)).toBeFalsy();
// 	// 	expect(goalWithInnerClause.Unify(x)).toBeFalsy();
// 	// 	expect(x.Unify(clause3)).toBeFalsy();
// 	// 	expect(clause3.Unify(x)).toBeFalsy();
// 	// 	expect(clause2.Lhs.Unify(clause3.Lhs)).toBeTruthy();
// 	// 	expect(clause3.Lhs.Unify(clause2.Lhs)).toBeTruthy();
// 	// 	expect(clause1.Unify(clause4)).toBeTruthy();
// 	// 	expect(clause4.Unify(clause1)).toBeTruthy();
// 	// 	expect(clause2.Unify(clause5)).toBeTruthy();
// 	// 	expect(clause5.Unify(clause2)).toBeTruthy();
// });

// test('LL(1) Prolog permutation test 1', () => {
// 	prologTest([
// 		['append([], L, L).', PrologGlobalInfo.ClauseAdded],
// 		[
// 			'append([X | Y], L, [X | Z]) :- append(Y, L, Z).',
// 			PrologGlobalInfo.ClauseAdded
// 		],
// 		['permutation([], []).', PrologGlobalInfo.ClauseAdded],
// 		['permutation(L, [H | T]) :- append(V, [H | U], L), append(V, U, W), permutation(W, T).', PrologGlobalInfo.ClauseAdded],
// 		['?- .', ['Satisfied', 'A -> ']]
// 	]);
// });

test('LL(1) Prolog list reversal test 1', () => {
	prologTest([
		[
			'accRev([H | T], A, R):-  accRev(T, [H | A], R).',
			PrologGlobalInfo.ClauseAdded
		],
		['accRev([], A, A).', PrologGlobalInfo.ClauseAdded],
		['rev(L, R) :- accRev(L, [], R).', PrologGlobalInfo.ClauseAdded],
		['?- rev([1, 2, 3, 4], R).', ['Satisfied', 'R -> [4, 3, 2, 1]']],
		['?- accRev([1, 2, 3, 4], [], R).', ['Satisfied']],
		['?- accRev([], [], R).', ['Satisfied', '[R -> []]']],
		['?- accRev([1], [], R).', ['Satisfied', '[R -> [1]]']],
		['?- accRev([1, 2], [], R).', ['Satisfied', '[R -> [2, 1]]']],
		['?- accRev([1, 2, 3], [], R).', ['Satisfied', '[R -> [3, 2, 1]]']],
		[
			'?- accRev([1, 2, 3, 4], [], R).',
			['Satisfied', '[R -> [4, 3, 2, 1]]']
		]
	]);
});

// test('LL(1) Prolog list reversal test 2', () => {
// 	prologTest([
// 		[
// 			'accRev(cons(H, T), A, R):-  accRev(T, cons(H, A), R).',
// 			PrologGlobalInfo.ClauseAdded
// 		],
// 		['accRev(nil, A, A).', PrologGlobalInfo.ClauseAdded],
// 		['?- accRev(nil, nil, R).', ['Satisfied']] // ,
// 		// ['?- accRev(cons(1, cons(2, nil)), nil, R).', ['Satisfied']] // ,
// 	]);
// });

test('LL(1) Prolog Italian crossword test', () => {
	prologTest([
		['word(astante,  a,s,t,a,n,t,e).', PrologGlobalInfo.ClauseAdded],
		['word(astoria,  a,s,t,o,r,i,a).', PrologGlobalInfo.ClauseAdded],
		['word(baratto,  b,a,r,a,t,t,o).', PrologGlobalInfo.ClauseAdded],
		['word(cobalto,  c,o,b,a,l,t,o).', PrologGlobalInfo.ClauseAdded],
		['word(pistola,  p,i,s,t,o,l,a).', PrologGlobalInfo.ClauseAdded],
		['word(statale,  s,t,a,t,a,l,e).', PrologGlobalInfo.ClauseAdded],
		['member(X,[X|_]).', PrologGlobalInfo.ClauseAdded],
		['member(X,[_|L]) :- member(X,L).', PrologGlobalInfo.ClauseAdded],
		['unique_list([]).', PrologGlobalInfo.ClauseAdded],
		[
			'unique_list([X|L]) :- \\+ member(X, L), unique_list(L).',
			PrologGlobalInfo.ClauseAdded
		],
		[
			'crossword(V1, V2, V3, H1, H2, H3) :- word(V1, _, V12, _, V14, _, V16, _), word(V2, _, V22, _, V24, _, V26, _), word(V3, _, V32, _, V34, _, V36, _), word(H1, _, V12, _, V22, _, V32, _), word(H2, _, V14, _, V24, _, V34, _), word(H3, _, V16, _, V26, _, V36, _), unique_list([V1, V2, V3, H1, H2, H3]).',
			PrologGlobalInfo.ClauseAdded
		],
		[
			'?- crossword(V1, V2, V3, H1, H2, H3).',
			[
				'Satisfying substitution is: [H1 -> astoria; H2 -> baratto; H3 -> statale; V1 -> astante; V2 -> cobalto; V3 -> pistola]',
				'Satisfied'
			]
		]
	]);
});

test('LL(1) Prolog math test 1 : addition', () => {
	prologTest([
		[
			'?- add(2, 3, N).',
			['Satisfying substitution is: [N -> 5]', 'Satisfied']
		]
	]);
});

test('LL(1) Prolog math test 2 : subtraction', () => {
	prologTest([
		[
			'?- sub(8, 5, N).',
			['Satisfying substitution is: [N -> 3]', 'Satisfied']
		]
	]);
});

test('LL(1) Prolog math test 3 : multiplication', () => {
	prologTest([
		[
			'?- mult(7, 13, N).',
			[
				'Satisfying substitution is: [N -> 91]',
				PrologGlobalInfo.Satisfied
			]
		]
	]);
});

test('LL(1) Prolog arithmetic comparison test 1', () => {
	prologTest([['?- lt(7, 13).', ['Satisfied']]]);
});

test('LL(1) Prolog arithmetic comparison test 1', () => {
	prologTest([['?- lt(17, 13).', ['Not satisfied']]]);
});

test('LL(1) Prolog permutation test 1', () => {
	prologTest(
		[
			['append([], L, L).', PrologGlobalInfo.ClauseAdded],
			[
				'append([X | Y], L, [X | Z]) :- append(Y, L, Z).',
				PrologGlobalInfo.ClauseAdded
			],
			['permutation([], []).', PrologGlobalInfo.ClauseAdded],
			[
				'permutation(L, [H|T]) :- append(V, [H|U], L), append(V, U, W), permutation(W, T).',
				PrologGlobalInfo.ClauseAdded
			],
			[
				'?- permutation([red, green, blue], C).',
				[
					'C = [red, green, blue]',
					'C = [red, blue, green]',
					'C = [green, red, blue]',
					'C = [green, blue, red]',
					'C = [blue, red, green]',
					'C = [blue, green, red]',
					PrologGlobalInfo.NotSatisfied
				]
			]
		],
		true
	);
});
