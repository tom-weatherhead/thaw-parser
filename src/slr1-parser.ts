// tom-weatherhead/thaw-parser/src/slr1-parser.ts

import { IImmutableSet } from 'thaw-common-utilities.ts';

import { GrammarSymbol, IGrammar } from 'thaw-interpreter-types';

import { CFSMState, LR0Configuration, LR0Parser } from './lr0-parser';

import { ShiftReduceAction } from './shift-reduce-actions';

import { ReduceReduceConflictException } from './exceptions/reduce-reduce-conflict';
import { ShiftReduceConflictException } from './exceptions/shift-reduce-conflict';

export class SLR1Parser extends LR0Parser {
	constructor(g: IGrammar) {
		super(g);
	}

	// public SLR1Parser(GrammarSelector gs)
	//     : this(GrammarFactory.Create(gs))
	// {
	// }

	// Adapted from Fischer and LeBlanc, pages 158-159.

	private GetActionSLR1(
		S: CFSMState,
		tokenAsSymbol: GrammarSymbol
	): {
		reduceProductionNum: number;
		action: ShiftReduceAction;
	} {
		let result = ShiftReduceAction.Error;
		let reduceResultFound = false; // In order for the grammar to be SLR(1), there must be at most one result per state-symbol pair.

		let reduceProductionNum = -1;

		// 1) Search for Reduce actions.

		for (const c of S.ConfigurationSet) {
			const matchedProduction = c.ConvertToProductionIfAllMatched();

			if (typeof matchedProduction === 'undefined') {
				continue;
			}

			let currentFollowSet: IImmutableSet<GrammarSymbol> | undefined;

			for (let i = 0; i < this.grammar.productions.length; ++i) {
				const productionToCompare = this.grammar.productions[i].stripOutSemanticActions();

				if (matchedProduction.equals(productionToCompare)) {
					// Is tokenAsSymbol in Follow(productionToCompare.lhs) ?

					if (typeof currentFollowSet === 'undefined') {
						const value = this.followSet.get(matchedProduction.lhs);

						if (typeof value === 'undefined') {
							throw new Error('matchedProduction.lhs has no followSet');
						}

						currentFollowSet = value;
					}

					if (
						typeof currentFollowSet !== 'undefined' &&
						currentFollowSet.contains(tokenAsSymbol)
					) {
						if (reduceResultFound && reduceProductionNum !== i) {
							// 2013/10/22 : To find out why my CLU grammar is not SLR(1):

							// throw new ReduceReduceConflictException(string.Format(
							// "GetActionSLR1() : Multiple actions found; grammar is not SLR(1).  Symbol {0}, productions {1} and {2}.",
							// //tokenAsSymbol, reduceProductionNum, i));
							// tokenAsSymbol, grammar.Productions[reduceProductionNum].ToString(), grammar.Productions[i].ToString())); // The .ToString() here may be unnecessary.

							throw new ReduceReduceConflictException(
								`GetActionSLR1() : Multiple actions found (Reduce-Reduce Conflict); grammar is not SLR(1). GrammarSymbol ${GrammarSymbol[tokenAsSymbol]}, productions ${this.grammar.productions[reduceProductionNum]} and ${this.grammar.productions[i]}.`
							);
						}

						result = ShiftReduceAction.Reduce;
						reduceProductionNum = i;
						reduceResultFound = true;
					}
				}
			}
		}

		// 2) Search for Shift and Accept actions.
		// const shiftOrAcceptResultFound = S.ConfigurationSet.toArray().some(
		// 	(c: LR0Configuration) => {
		// 		const symbol = c.FindSymbolAfterDot();
		//
		// 		return typeof symbol !== 'undefined' && symbol === tokenAsSymbol;
		// 	}
		// );
		const shiftOrAcceptResults = S.ConfigurationSet.toArray().filter((c: LR0Configuration) => {
			const symbol = c.FindSymbolAfterDot();

			return typeof symbol !== 'undefined' && symbol === tokenAsSymbol;
		});

		if (shiftOrAcceptResults.length > 0) {
			if (reduceResultFound) {
				// throw new ShiftReduceConflictException(string.Format(
				// "GetActionSLR1() : Multiple actions found; grammar is not SLR(1).  Symbol {0}, production {1}.",
				// tokenAsSymbol, grammar.Productions[reduceProductionNum].ToString())); // The .ToString() here may be unnecessary.

				throw new ShiftReduceConflictException(
					`GetActionSLR1() : Multiple actions found (Shift-Reduce Conflict); grammar is not SLR(1).  GrammarSymbol ${
						GrammarSymbol[tokenAsSymbol]
					}; shift configurations ${shiftOrAcceptResults.join(', ')}; reduce production ${
						this.grammar.productions[reduceProductionNum]
					}.`
				);
			}

			result =
				tokenAsSymbol === GrammarSymbol.terminalEOF
					? ShiftReduceAction.Accept
					: ShiftReduceAction.Shift;
		}

		// Test:

		// if (result == ShiftReduceAction.Error) {
		// 	StringBuilder sb = new StringBuilder();
		// 	string separator = string.Empty;

		// 	for each (Symbol transitionSymbol in S.Transitions.Keys) {
		// 		sb.Append(separator);
		// 		sb.Append(transitionSymbol.ToString());
		// 		separator = ", ";
		// 	}

		// 	throw new Exception(string.Format("GetActionSLR1() error: symbol = {0}; transition keys = {1}", tokenAsSymbol, sb.ToString()));
		// }

		// return result;

		return {
			reduceProductionNum,
			action: result
		};
	}

	protected override GetActionCaller(
		S: CFSMState,
		tokenAsSymbol: GrammarSymbol
	): {
		reduceProductionNum: number;
		action: ShiftReduceAction;
	} {
		return this.GetActionSLR1(S, tokenAsSymbol);
	}
}
