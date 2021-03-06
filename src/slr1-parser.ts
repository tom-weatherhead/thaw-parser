// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Text;

import { Set } from 'thaw-common-utilities.ts';

import { IGrammar, Symbol } from 'thaw-grammar';

import { CFSMState, LR0Configuration, LR0Parser, ShiftReduceAction } from './lr0-parser';

// namespace Inference.Parser
// {
/* eslint-disable @typescript-eslint/ban-types */
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
		tokenAsSymbol: Symbol
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

			// console.log(`matchedProduction is ${matchedProduction}`);

			if (typeof matchedProduction === 'undefined') {
				continue;
			}

			let currentFollowSet: Set<Symbol> | undefined;

			for (let i = 0; i < this.grammar.productions.length; ++i) {
				const productionToCompare = this.grammar.productions[i].StripOutSemanticActions();

				// console.log(
				// 	`Comparing ${matchedProduction} to ${productionToCompare}...`
				// );

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
							//throw new ReduceReduceConflictException("GetActionSLR1() : Multiple actions found; grammar is not SLR(1).");

							// 2013/10/22 : To find out why my CLU grammar is not SLR(1):

							// throw new ReduceReduceConflictException(string.Format(
							// "GetActionSLR1() : Multiple actions found; grammar is not SLR(1).  Symbol {0}, productions {1} and {2}.",
							// //tokenAsSymbol, reduceProductionNum, i));
							// tokenAsSymbol, grammar.Productions[reduceProductionNum].ToString(), grammar.Productions[i].ToString())); // The .ToString() here may be unnecessary.

							throw new Error(
								`GetActionSLR1() : Multiple actions found; grammar is not SLR(1). Symbol ${tokenAsSymbol}, productions ${this.grammar.productions[reduceProductionNum]} and ${this.grammar.productions[i]}.`
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
		/*
		bool shiftOrAcceptResultFound = false;

		for each (LR0Configuration c in S.ConfigurationSet) {
			Symbol symbol;

			if (c.FindSymbolAfterDot(out symbol) && symbol == tokenAsSymbol) {
				shiftOrAcceptResultFound = true;
			}
		}
		 */

		// Symbol symbol;
		const shiftOrAcceptResultFound = S.ConfigurationSet.toArray().some(
			(c: LR0Configuration) => {
				const symbol = c.FindSymbolAfterDot();

				return typeof symbol !== 'undefined' && symbol === tokenAsSymbol;
			}
		);

		if (shiftOrAcceptResultFound) {
			if (reduceResultFound) {
				// throw new ShiftReduceConflictException(string.Format(
				// "GetActionSLR1() : Multiple actions found; grammar is not SLR(1).  Symbol {0}, production {1}.",
				// tokenAsSymbol, grammar.Productions[reduceProductionNum].ToString())); // The .ToString() here may be unnecessary.

				throw new Error(
					`GetActionSLR1() : Multiple actions found; grammar is not SLR(1).  Symbol ${tokenAsSymbol}, production ${this.grammar.productions[reduceProductionNum]}.`
				);
			}

			result =
				tokenAsSymbol === Symbol.terminalEOF
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
		tokenAsSymbol: Symbol
	): {
		reduceProductionNum: number;
		action: ShiftReduceAction;
	} {
		return this.GetActionSLR1(S, tokenAsSymbol);
	}
}
/* eslint-enable @typescript-eslint/ban-types */
// }
