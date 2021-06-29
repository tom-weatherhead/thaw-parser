// tom-weatherhead/thaw-parser/src/parser-base.ts

import { Set } from 'thaw-common-utilities.ts';

import { Token } from 'thaw-lexical-analyzer';

import { IGrammar, Production, Symbol } from 'thaw-grammar';

import { ParserException } from './exceptions/parser-exception';
import { IParser } from './iparser';

/* eslint-disable @typescript-eslint/ban-types */
export abstract class ParserBase implements IParser {
	protected readonly grammar: IGrammar;
	protected readonly derivesLambda = new Set<Symbol>();
	protected readonly firstSet = new Map<Symbol, Set<Symbol>>();
	protected readonly followSet = new Map<Symbol, Set<Symbol>>();

	protected constructor(g: IGrammar) {
		this.grammar = g;

		this.markLambda();
		this.fillFirstSet();
		this.fillFollowSet();
	}

	public abstract recognize(tokenList: Token[]): void;

	public abstract parse(tokenList: Token[]): unknown;

	protected withoutLambda(ie: Iterable<Symbol>): Set<Symbol> {
		const pred = (n: Symbol) => n !== Symbol.Lambda;
		const result = new Set<Symbol>();

		// while (!ie.isDone()) {
		// 	const element = ie.next() as number;
		for (const element of ie) {
			if (pred(element)) {
				result.add(element);
			}
		}

		return result;
	}

	// Adapted from Fischer and LeBlanc, page 104

	protected computeFirst(alpha: Symbol[]): Set<Symbol> {
		const k = alpha.length;
		const result = new Set<Symbol>();

		if (k === 0 || (k === 1 && alpha[0] === Symbol.Lambda)) {
			// ThAW: Originally, this line was just: if (k == 0)
			result.add(Symbol.Lambda);
		} else {
			const firstSetForAlpha0 = this.firstSet.get(alpha[0]);

			if (typeof firstSetForAlpha0 === 'undefined') {
				throw new ParserException(
					`computeFirst() : firstSet does not contain the key ${
						Symbol[alpha[0]]
					} (${alpha[0]}); k is ${k}; alpha is ${alpha}`
				);
			}

			result.unionInPlace(firstSetForAlpha0);

			let i;

			for (i = 1; i < k; ++i) {
				const firstSetForAlphaiMinus1 = this.firstSet.get(alpha[i - 1]);

				if (typeof firstSetForAlphaiMinus1 === 'undefined') {
					break;
				}

				if (!firstSetForAlphaiMinus1.contains(Symbol.Lambda)) {
					break;
				}

				// Test:
				const firstSetForAlphai = this.firstSet.get(alpha[i]);

				if (typeof firstSetForAlphai === 'undefined') {
					throw new ParserException(
						`computeFirst() : firstSet does not contain the key ${alpha[i]}`
					);
				}

				result.unionInPlace(this.withoutLambda(firstSetForAlphai));
			}

			const firstSetForAlphakMinus1 = this.firstSet.get(alpha[k - 1]);

			if (
				i === k &&
				typeof firstSetForAlphakMinus1 !== 'undefined' &&
				firstSetForAlphakMinus1.contains(Symbol.Lambda) &&
				!result.contains(Symbol.Lambda)
			) {
				result.add(Symbol.Lambda);
			}
		}

		return result;
	}

	// protected List<Symbol> ExtractSymbols(List<object> list) {
	// 	var result = new List<Symbol>();

	// 	list.Where(o => o is Symbol).ToList().For Each(o => result.Add((Symbol)o));

	// 	return result;
	// }

	// Adapted from Fischer and LeBlanc, page 105

	protected fillFirstSet(): void {
		// this.grammar.nonTerminals.for Each((A: Symbol) => {
		for (const A of this.grammar.nonTerminals) {
			const s = new Set<Symbol>();

			if (this.derivesLambda.contains(A)) {
				s.add(Symbol.Lambda);
			}

			this.firstSet.set(A, s);
		} // );

		// this.grammar.terminals.for Each((a: Symbol) => {
		for (const a of this.grammar.terminals) {
			const s = new Set<Symbol>();

			s.add(a);
			this.firstSet.set(a, s);

			// this.grammar.nonTerminals.for Each((A: Symbol) => {
			for (const A of this.grammar.nonTerminals) {
				// If there exists a production A -> a beta
				const value = this.firstSet.get(A);

				if (
					this.productionExists(A, a) &&
					typeof value !== 'undefined'
				) {
					value.unionInPlace(s);
					this.firstSet.set(A, value);
				}
			} // );
		} // );

		let changes = true;

		while (changes) {
			changes = false;

			// this.grammar.productions.for Each((p: Production) => {
			for (const p of this.grammar.productions) {
				const s = this.computeFirst(p.RHSWithNoSemanticActions());
				const firstSetOfPLHSRaw = this.firstSet.get(p.lhs);

				if (typeof firstSetOfPLHSRaw === 'undefined') {
					throw new ParserException(
						`FillFirstSet() : ${Symbol[p.lhs]} (${
							p.lhs
						}) is not a key in firstSet`
					);
				}

				const firstSetOfPLHS = firstSetOfPLHSRaw; // as Set<Symbol>;

				if (!s.isASubsetOf(firstSetOfPLHS)) {
					firstSetOfPLHS.unionInPlace(s);
					changes = true;
				}
			} // );
		}
	}

	/*
	protected List<object> Sublist(List<object> src, int i)
	{
		return src.Skip(i).ToList();
	}
	 */

	// Adapted from Fischer and LeBlanc, page 106

	protected fillFollowSet(): void {
		// this.grammar.nonTerminals.for Each((A: Symbol) => {
		for (const A of this.grammar.nonTerminals) {
			this.followSet.set(A, new Set<Symbol>());
		}
		// });

		const value = this.followSet.get(this.grammar.startSymbol);

		if (typeof value !== 'undefined') {
			value.add(Symbol.Lambda);
		}

		let changes = true;

		while (changes) {
			changes = false;

			// For each production and each occurrence of a nonterminal in its right-hand side.

			// this.grammar.productions.for Each((p: Production) => {
			for (const p of this.grammar.productions) {
				const rhs = p.RHSWithNoSemanticActions();

				// for (int i = 0; i < p.rhs.Count; ++i)
				for (let i = 0; i < rhs.length; ++i) {
					/*
					object o = p.rhs[i];

					if (!(o is Symbol))
					{
						continue;
					}

					Symbol B = (Symbol)o;
					 */
					const B = rhs[i];

					// if (!this.grammar.nonTerminals.contains(B)) {
					if (this.grammar.nonTerminals.indexOf(B) < 0) {
						continue;
					}

					// List<object> beta = Sublist(p.rhs, i + 1);
					// const beta: Symbol[] = rhs.Skip(i + 1).ToList();
					const beta: Symbol[] = rhs.slice(i + 1);

					// HashSet<Symbol> s = ComputeFirst(ExtractSymbols(beta));
					const s = this.computeFirst(beta);
					const sWithoutLambda = this.withoutLambda(s);
					const followSetOfB = this.followSet.get(B); // as Set<Symbol>;
					const followSetOfPLhs = this.followSet.get(p.lhs);

					if (typeof followSetOfB === 'undefined') {
						continue;
					}

					if (!sWithoutLambda.isASubsetOf(followSetOfB)) {
						followSetOfB.unionInPlace(sWithoutLambda);
						changes = true;
					}

					if (
						typeof followSetOfPLhs !== 'undefined' &&
						s.contains(Symbol.Lambda) &&
						!followSetOfPLhs.isASubsetOf(followSetOfB)
					) {
						followSetOfB.unionInPlace(followSetOfPLhs);
						changes = true;
					}

					if (changes) {
						this.followSet.set(B, followSetOfB);
					}
				}
			} // );
		}
	}

	private productionExists(A: Symbol, a: Symbol): boolean {
		return this.grammar.productions.some(
			(p: Production) =>
				p.lhs === A &&
				p.rhs.length > 0 &&
				typeof p.rhs[0] !== 'string' &&
				(p.rhs[0] as Symbol) === a
		);
	}

	// Adapted from Fischer and LeBlanc, page 103

	private markLambda(): void {
		let changes: boolean;

		do {
			changes = false;

			// this.grammar.productions.for Each((p: Production) => {
			for (const p of this.grammar.productions) {
				if (!this.derivesLambda.contains(p.lhs)) {
					const rhsDerivesLambda = p
						.RHSWithNoSemanticActions()
						.every((rhsSymbol: Symbol) =>
							this.derivesLambda.contains(rhsSymbol)
						);

					if (rhsDerivesLambda) {
						this.derivesLambda.add(p.lhs);
						changes = true;
					}
				}
			} // );
		} while (changes);
	}
}
/* eslint-enable @typescript-eslint/ban-types */
