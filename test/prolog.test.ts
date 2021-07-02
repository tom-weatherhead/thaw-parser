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

test('LL(1) Prolog parser instance creation test', () => {
	// Arrange
	const ls = LanguageSelector.Prolog2;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) Prolog recognize test', () => {
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

	f('factorial(0,1).');
	f(
		'factorial(N, F) :- gt(N, 0), sub(N, 1, N1), factorial(N1, F1), mult(N, F1, F).'
	);

	expect(() => f('pred1(A.')).toThrow(ParserException);
});

function success(substitutionAsString = ''): string {
	const satisfying =
		substitutionAsString !== ''
			? `Satisfying substitution is: [${substitutionAsString}]\n`
			: '';

	return `${satisfying}${PrologGlobalInfo.Satisfied}\n`;
}

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

test('LL(1) Prolog arithmetic comparison test 1', () => {
	prologTest([['?- lt(7, 13).', ['Satisfied']]]);
});

test('LL(1) Prolog arithmetic comparison test 2', () => {
	prologTest([['?- lt(17, 13).', ['Not satisfied']]]);
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

test('LL(1) Prolog addition test', () => {
	prologTest([
		['?- add(1, 2, 3).', success()],
		['?- add(1, 1, 3).', PrologGlobalInfo.NotSatisfied + '\n'],
		['?- add(N, 3, 5).', success('N -> 2')],
		['?- add(2, N, 5).', success('N -> 3')],
		['?- add(2, 3, N).', success('N -> 5')]
	]);
});

test('LL(1) Prolog subtraction test', () => {
	prologTest([
		['?- sub(8, 5, 3).', success()],
		['?- sub(8, 5, 77).', PrologGlobalInfo.NotSatisfied + '\n'],
		['?- sub(N, 3, 5).', success('N -> 8')],
		['?- sub(8, N, 3).', success('N -> 5')],
		['?- sub(8, 5, N).', success('N -> 3')]
	]);
});

test('LL(1) Prolog list reverse test', () => {
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

test('LL(1) Prolog list reversal test', () => {
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
				'Satisfying substitution is: [C -> [red, green, blue]]\n' +
					'Satisfying substitution is: [C -> [red, blue, green]]\n' +
					'Satisfying substitution is: [C -> [green, red, blue]]\n' +
					'Satisfying substitution is: [C -> [green, blue, red]]\n' +
					'Satisfying substitution is: [C -> [blue, red, green]]\n' +
					'Satisfying substitution is: [C -> [blue, green, red]]\n' +
					'Number of solutions found: 6\n' +
					PrologGlobalInfo.Satisfied +
					'\n'
			]
		],
		true
	);
});

test('LL(1) Prolog factorial test 1', () => {
	// sub(N, 1, N1) means: N1 = N - 1
	prologTest([
		['factorial(0, 1).', PrologGlobalInfo.ClauseAdded],
		[
			// 'factorial(N, F) :- gt(N, 0), N1 is sub(N, 1), factorial(N1, F1), F is mult(N, F1).',
			'factorial(N, F) :- gt(N, 0), sub(N, 1, N1), factorial(N1, F1), mult(N, F1, F).',
			PrologGlobalInfo.ClauseAdded
		],
		['?- gt(1, 0).', [PrologGlobalInfo.Satisfied]],
		['?- sub(1, 1, 0).', [PrologGlobalInfo.Satisfied]],
		['?- sub(8, 5, 3).', [PrologGlobalInfo.Satisfied]],
		['?- factorial(1, 1).', [PrologGlobalInfo.Satisfied]],
		['?- factorial(2, 2).', [PrologGlobalInfo.Satisfied]],
		['?- factorial(3, 6).', [PrologGlobalInfo.Satisfied]],
		['?- factorial(4, 24).', [PrologGlobalInfo.Satisfied]],
		['?- factorial(5, 120).', [PrologGlobalInfo.Satisfied]]
	]);
});
