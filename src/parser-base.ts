// tom-weatherhead/thaw-parser/src/parser-base.ts

'use strict';

import { IIterator, Set } from 'thaw-common-utilities.ts';

import { Token } from 'thaw-lexical-analyzer';

import { IGrammar, Production, Symbol } from 'thaw-grammar';

import { ParserException } from './exceptions/parser-exception';
import { IParser } from './iparser';

export abstract class ParserBase implements IParser {
	protected readonly grammar: IGrammar;
	protected readonly derivesLambda = new Set<number>();
	protected readonly firstSet = new Map<number, Set<number>>();
	protected readonly followSet = new Map<number, Set<number>>();

	protected constructor(g: IGrammar) {
		this.grammar = g;

		this.markLambda();
		this.fillFirstSet();
		this.fillFollowSet();
	}

	public abstract recognize(tokenList: Token[]): void;

	public abstract parse(tokenList: Token[]): any;

	protected withoutLambda(ie: IIterator<number>): Set<number> {
		const pred = (n: number) => n !== Symbol.Lambda;
		const result = new Set<number>();

		while (!ie.isDone()) {
			const element = ie.next() as number;

			if (pred(element)) {
				result.add(element);
			}
		}

		return result;
	}

	// Adapted from Fischer and LeBlanc, page 104

	protected computeFirst(alpha: number[]): Set<number> {
		const k = alpha.length;
		const result = new Set<number>();

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

			result.unionInPlace(firstSetForAlpha0 as Set<number>);

			let i;

			for (i = 1; i < k; ++i) {
				const firstSetForAlphaiMinus1 = this.firstSet.get(
					alpha[i - 1]
				);

				if (typeof firstSetForAlphaiMinus1 === 'undefined') {
					break;
				}

				if (
					!(firstSetForAlphaiMinus1 as Set<number>).contains(
						Symbol.Lambda
					)
				) {
					break;
				}

				// Test:
				const firstSetForAlphai = this.firstSet.get(alpha[i]);

				if (typeof firstSetForAlphai === 'undefined') {
					throw new ParserException(
						`computeFirst() : firstSet does not contain the key ${alpha[i]}`
					);
				}

				result.unionInPlace(
					this.withoutLambda(
						(firstSetForAlphai as Set<number>).getIterator()
					)
				);
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

	// 	list.Where(o => o is Symbol).ToList().ForEach(o => result.Add((Symbol)o));

	// 	return result;
	// }

	// Adapted from Fischer and LeBlanc, page 105

	protected fillFirstSet(): void {
		this.grammar.nonTerminals.forEach((A: number) => {
			const s = new Set<number>();

			if (this.derivesLambda.contains(A)) {
				s.add(Symbol.Lambda);
			}

			this.firstSet.set(A, s);
		});

		this.grammar.terminals.forEach((a: number) => {
			const s = new Set<number>();

			s.add(a);
			this.firstSet.set(a, s);

			this.grammar.nonTerminals.forEach((A: number) => {
				// If there exists a production A -> a beta
				if (this.productionExists(A, a)) {
					(this.firstSet.get(A) as Set<number>).unionInPlace(s);
				}
			});
		});

		let changes = true;

		while (changes) {
			changes = false;

			this.grammar.productions.forEach((p: Production) => {
				const s = this.computeFirst(p.RHSWithNoSemanticActions());
				const firstSetOfPLHSRaw = this.firstSet.get(p.lhs);

				if (typeof firstSetOfPLHSRaw === 'undefined') {
					throw new ParserException(
						`FillFirstSet() : ${Symbol[p.lhs]} (${
							p.lhs
						}) is not a key in firstSet`
					);
				}

				const firstSetOfPLHS = firstSetOfPLHSRaw as Set<number>;

				if (!s.isASubsetOf(firstSetOfPLHS)) {
					firstSetOfPLHS.unionInPlace(s);
					changes = true;
				}
			});
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
		this.grammar.nonTerminals.forEach((A: number) => {
			this.followSet.set(A, new Set<number>());
		});

		(this.followSet.get(this.grammar.startSymbol) as Set<number>).add(
			Symbol.Lambda
		);

		let changes = true;

		while (changes) {
			changes = false;

			// For each production and each occurrence of a nonterminal in its right-hand side.

			this.grammar.productions.forEach((p: Production) => {
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
					// const beta: number[] = rhs.Skip(i + 1).ToList();
					const beta: number[] = rhs.slice(i + 1);

					// HashSet<Symbol> s = ComputeFirst(ExtractSymbols(beta));
					const s = this.computeFirst(beta);
					const sWithoutLambda = this.withoutLambda(
						s.getIterator()
					);
					const followSetOfB = this.followSet.get(B) as Set<number>;

					if (!sWithoutLambda.isASubsetOf(followSetOfB)) {
						followSetOfB.unionInPlace(sWithoutLambda);
						changes = true;
					}

					if (
						s.contains(Symbol.Lambda) &&
						!(this.followSet.get(p.lhs) as Set<
							number
						>).isASubsetOf(followSetOfB)
					) {
						followSetOfB.unionInPlace(
							this.followSet.get(p.lhs) as Set<number>
						);
						changes = true;
					}

					if (changes) {
						this.followSet.set(B, followSetOfB);
					}
				}
			});
		}
	}

	private productionExists(A: number, a: number): boolean {
		return this.grammar.productions.some(
			(p: Production) =>
				p.lhs === A && p.rhs.length > 0 && (p.rhs[0] as number) === a
		);
	}

	// Adapted from Fischer and LeBlanc, page 103

	private markLambda(): void {
		let changes: boolean;

		do {
			changes = false;

			this.grammar.productions.forEach((p: Production) => {
				if (!this.derivesLambda.contains(p.lhs)) {
					const rhsDerivesLambda = p
						.RHSWithNoSemanticActions()
						.every((rhsSymbol: number) =>
							this.derivesLambda.contains(rhsSymbol)
						);

					if (rhsDerivesLambda) {
						this.derivesLambda.add(p.lhs);
						changes = true;
					}
				}
			});
		} while (changes);
	}
}
