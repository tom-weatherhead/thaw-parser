// tom-weatherhead/thaw-parser/src/parser-base.ts

import { createSet, ISet } from 'thaw-common-utilities.ts';

import { GrammarSymbol, IGrammar, IParser, IProduction, IToken } from 'thaw-interpreter-types';

// import {  } from 'thaw-lexical-analyzer';

// import { IGrammar, Production, Symbol } from 'thaw-grammar';

import { ParserException } from './exceptions/parser';

export abstract class ParserBase implements IParser {
	protected readonly grammar: IGrammar;
	protected readonly derivesLambda = createSet<GrammarSymbol>();
	protected readonly firstSet = new Map<GrammarSymbol, ISet<GrammarSymbol>>();
	protected readonly followSet = new Map<GrammarSymbol, ISet<GrammarSymbol>>();

	protected constructor(g: IGrammar) {
		this.grammar = g;

		this.markLambda();
		this.fillFirstSet();
		this.fillFollowSet();
	}

	public abstract recognize(tokenList: IToken[]): void;

	public abstract parse(tokenList: IToken[]): unknown;

	protected withoutLambda(ie: Iterable<GrammarSymbol>): ISet<GrammarSymbol> {
		const pred = (n: GrammarSymbol) => n !== GrammarSymbol.Lambda;
		const result = createSet<GrammarSymbol>();

		for (const element of ie) {
			if (pred(element)) {
				result.add(element);
			}
		}

		return result;
	}

	// Adapted from Fischer and LeBlanc, page 104

	protected computeFirst(alpha: GrammarSymbol[]): ISet<GrammarSymbol> {
		const k = alpha.length;
		const result = createSet<GrammarSymbol>();

		if (k === 0 || (k === 1 && alpha[0] === GrammarSymbol.Lambda)) {
			// ThAW: Originally, this line was just: if (k == 0)
			result.add(GrammarSymbol.Lambda);
		} else {
			const firstSetForAlpha0 = this.firstSet.get(alpha[0]);

			if (typeof firstSetForAlpha0 === 'undefined') {
				throw new ParserException(
					`computeFirst() : firstSet does not contain the key ${
						GrammarSymbol[alpha[0]]
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

				if (!firstSetForAlphaiMinus1.contains(GrammarSymbol.Lambda)) {
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
				firstSetForAlphakMinus1.contains(GrammarSymbol.Lambda) &&
				!result.contains(GrammarSymbol.Lambda)
			) {
				result.add(GrammarSymbol.Lambda);
			}
		}

		return result;
	}

	// Adapted from Fischer and LeBlanc, page 105

	protected fillFirstSet(): void {
		for (const A of this.grammar.nonTerminals) {
			const s = createSet<GrammarSymbol>();

			if (this.derivesLambda.contains(A)) {
				s.add(GrammarSymbol.Lambda);
			}

			this.firstSet.set(A, s);
		}

		for (const a of this.grammar.terminals) {
			const s = createSet<GrammarSymbol>();

			s.add(a);
			this.firstSet.set(a, s);

			for (const A of this.grammar.nonTerminals) {
				// If there exists a production A -> a beta
				const value = this.firstSet.get(A);

				if (this.productionExists(A, a) && typeof value !== 'undefined') {
					value.unionInPlace(s);
					this.firstSet.set(A, value);
				}
			}
		}

		let changes = true;

		while (changes) {
			changes = false;

			// this.grammar.productions.for Each((p: Production) => {
			for (const p of this.grammar.productions) {
				const s = this.computeFirst(p.getRHSWithNoSemanticActions());
				const firstSetOfPLHSRaw = this.firstSet.get(p.lhs);

				if (typeof firstSetOfPLHSRaw === 'undefined') {
					throw new ParserException(
						`FillFirstSet() : ${GrammarSymbol[p.lhs]} (${
							p.lhs
						}) is not a key in firstSet`
					);
				}

				const firstSetOfPLHS = firstSetOfPLHSRaw; // as Set<GrammarSymbol>;

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
		// this.grammar.nonTerminals.for Each((A: GrammarSymbol) => {
		for (const A of this.grammar.nonTerminals) {
			this.followSet.set(A, createSet<GrammarSymbol>());
		}
		// });

		const value = this.followSet.get(this.grammar.startSymbol);

		if (typeof value !== 'undefined') {
			value.add(GrammarSymbol.Lambda);
		}

		let changes = true;

		while (changes) {
			changes = false;

			// For each production and each occurrence of a nonterminal in its right-hand side.

			for (const p of this.grammar.productions) {
				const rhs = p.getRHSWithNoSemanticActions();

				for (let i = 0; i < rhs.length; ++i) {
					const B = rhs[i];

					if (this.grammar.nonTerminals.indexOf(B) < 0) {
						continue;
					}

					const beta: GrammarSymbol[] = rhs.slice(i + 1);
					const s = this.computeFirst(beta);
					const sWithoutLambda = this.withoutLambda(s);
					const followSetOfB = this.followSet.get(B);
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
						s.contains(GrammarSymbol.Lambda) &&
						!followSetOfPLhs.isASubsetOf(followSetOfB)
					) {
						followSetOfB.unionInPlace(followSetOfPLhs);
						changes = true;
					}

					if (changes) {
						this.followSet.set(B, followSetOfB);
					}
				}
			}
		}
	}

	private productionExists(A: GrammarSymbol, a: GrammarSymbol): boolean {
		return this.grammar.productions.some(
			(p: IProduction) =>
				p.lhs === A &&
				p.rhs.length > 0 &&
				typeof p.rhs[0] !== 'string' &&
				(p.rhs[0] as GrammarSymbol) === a
		);
	}

	// Adapted from Fischer and LeBlanc, page 103

	private markLambda(): void {
		let changes: boolean;

		do {
			changes = false;

			for (const p of this.grammar.productions) {
				if (!this.derivesLambda.contains(p.lhs)) {
					const rhsDerivesLambda = p
						.getRHSWithNoSemanticActions()
						.every((rhsSymbol: GrammarSymbol) =>
							this.derivesLambda.contains(rhsSymbol)
						);

					if (rhsDerivesLambda) {
						this.derivesLambda.add(p.lhs);
						changes = true;
					}
				}
			}
		} while (changes);
	}
}
