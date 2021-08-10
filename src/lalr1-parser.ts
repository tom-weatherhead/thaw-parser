// tom-weatherhead/thaw-parser/src/lalr1-parser.ts

import { IImmutableSet, Set, Stack } from 'thaw-common-utilities.ts';

import { IGrammar, Symbol } from 'thaw-grammar';

import { CFSMState, LR0Configuration, LR0Parser, ShiftReduceAction } from './lr0-parser';

import { LR1Configuration, LR1Parser } from './lr1-parser';

import { InternalErrorException } from './exceptions/internal-error';
import { ReduceReduceConflictException } from './exceptions/reduce-reduce-conflict';
import { ShiftReduceConflictException } from './exceptions/shift-reduce-conflict';
// import { ParserException } from './exceptions/parser';
// import { SyntaxException } from './exceptions/syntax';

/* eslint-disable @typescript-eslint/ban-types */

export class LALR1Configuration extends LR0Configuration {
	public static fromLR0(
		c: LR0Configuration,
		lookaheads: IImmutableSet<Symbol>
	): LALR1Configuration {
		const result = new LALR1Configuration(c.ProductionLHS);

		result.ProductionRHS.push(...c.ProductionRHS);
		result.Lookaheads.unionInPlace(lookaheads);

		return result;
	}

	public static fromLR1(c: LR1Configuration, ...lookaheads: Symbol[]): LALR1Configuration {
		const result = new LALR1Configuration(c.ProductionLHS, c.Lookahead);

		result.ProductionRHS.push(...c.ProductionRHS);

		for (const lookahead of lookaheads) {
			result.Lookaheads.add(lookahead);
		}

		return result;
	}

	public readonly Lookaheads = new Set<Symbol>();
	public readonly PropagateLinks = new Set<LALR1Configuration>();

	constructor(lhs: Symbol, ...looks: Symbol[]) {
		super(lhs);

		for (const look of looks) {
			this.Lookaheads.add(look);
		}
	}

	public override equals(other: unknown): boolean {
		const otherConfig = other as LALR1Configuration;

		// TODO: Try this:
		// if (otherConfig === this) {
		// 	return true;
		// }

		if (
			typeof otherConfig === 'undefined' ||
			!(other instanceof LALR1Configuration) ||
			!super.equals(other) ||
			!this.Lookaheads.isEqualTo(otherConfig.Lookaheads)
		) {
			return false;
		}

		return true;
	}

	// public override int GetHashCode() {
	// 	/*
	// 	int hashCode = base.GetHashCode() * 103;
	//
	// 	foreach (Symbol symbol in Lookaheads)
	// 	{
	// 		hashCode += symbol.GetHashCode();   // The order of the lookahead symbols does not alter the hash code.
	// 	}
	//
	// 	return hashCode;
	// 	 */
	//
	// 	// The order of the lookahead symbols does not alter the hash code.
	// 	return Lookaheads
	// 		.Select(symbol => symbol.GetHashCode())
	// 		.Aggregate(base.GetHashCode() * 103, (accumulator, hashCode) => accumulator + hashCode);
	// }

	public override toString(): string {
		// return `${super.toString()}; ${this.Lookahead}`;

		return 'LALR1Configuration.toString()';
	}

	// public override AdvanceDot(): LR1Configuration {
	// 	return LR1Configuration.fromLR0(super.AdvanceDot(), this.Lookahead);
	// }

	// The "new" keyword is used here because this function hides a function in the base class which differs only by return type.

	public override AdvanceDot(): LALR1Configuration {
		return LALR1Configuration.fromLR0(super.AdvanceDot(), this.Lookaheads);
	}

	public ToLR0Configuration(): LR0Configuration {
		// Unit tests show that this is necessary.
		return new LR0Configuration(this.ProductionLHS, this.ProductionRHS);
	}
}

// #endregion

// #region LALR1CFSMState

export class LALR1CFSMState {
	public readonly Transitions = new Map<Symbol, LALR1CFSMState>();

	constructor(public readonly ConfigurationSet: IImmutableSet<LALR1Configuration>) {}

	// public override bool Equals(object obj) {
	// 	// TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).
	//
	// 	// if (object.ReferenceEquals(this, obj)) {
	// 	// 	return true;
	// 	// }
	//
	// 	var that = obj as LALR1CFSMState;
	//
	// 	// TODO: Should we also consider Transitions.Keys?
	// 	return that != null && ConfigurationSet.IsSubsetOf(that.ConfigurationSet) && that.ConfigurationSet.IsSubsetOf(ConfigurationSet);
	// }

	public equals(other: unknown): boolean {
		const that = other as LALR1CFSMState;

		return typeof that !== 'undefined' && this.ConfigurationSet.equals(that.ConfigurationSet);
	}

	// public override int GetHashCode() {
	// 	// TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).
	// 	/*
	// 	int hashCode = 0;
	//
	// 	foreach (LALR1Configuration conf in ConfigurationSet)
	// 	{
	// 		// The order of the configurations in the set doesn't affect the hash code.
	// 		hashCode += conf.GetHashCode();
	// 	}
	//
	// 	// TODO: Should we also consider Transitions.Keys?
	// 	return hashCode;
	// 	 */
	// 	return ConfigurationSet
	// 		.Select(conf => conf.GetHashCode())
	// 		.Aggregate(0, (accumulator, hashCode) => accumulator + hashCode);
	// }
}

export class LALR1CFSM {
	public readonly StateList: LALR1CFSMState[];
	public readonly StartState: LALR1CFSMState;

	constructor(ss: LALR1CFSMState) {
		this.StartState = ss;
		this.StateList = [ss];
	}

	public FindStateWithLabel(cs: IImmutableSet<LALR1Configuration>): LALR1CFSMState {
		const result = this.StateList.find((state: LALR1CFSMState) =>
			state.ConfigurationSet.equals(cs)
		);

		if (typeof result === 'undefined') {
			throw new InternalErrorException(
				`LALR1CFSM.FindStateWithLabel() : No matching state found; label size == ${cs.size}.`
			);
		}

		return result;
	}
}

export class LALR1StateSymbolPair {
	constructor(public readonly state: LALR1CFSMState, public readonly symbol: Symbol) {}

	public equals(other: unknown): boolean {
		const that = other as LALR1StateSymbolPair;

		return (
			typeof that !== 'undefined' &&
			this.state.equals(that.state) &&
			this.symbol === that.symbol
		);
	}
}

export class LookaheadPropagationRecord {
	constructor(
		public readonly configuration: LALR1Configuration,
		public readonly lookahead: Symbol
	) {}
}

export class LALR1Parser extends LR0Parser {
	private readonly cognateDict = new Map<string, IImmutableSet<LALR1Configuration>>();

	constructor(g: IGrammar) {
		super(g);

		// console.log('this.machine is:', this.machine);
		// console.log('this.machine.StateList.length is:', this.machine.StateList.length);

		if (this.machine.StateList.every((state: CFSMState) => state.Transitions.size === 0)) {
			throw new InternalErrorException('All machine states have zero transitions.');
		}

		// for (const state of this.machine.StateList) {
		// 	console.log('Number of transitions for this state:', state.Transitions.size);
		// }

		this.BuildLALR1CFSM();
	}

	// public LALR1Parser(GrammarSelector gs)
	// 	: this(GrammarFactory.Create(gs))
	// {
	// }

	// See Fischer and LeBlanc, page 167.

	private Core(s: IImmutableSet<LALR1Configuration>): IImmutableSet<LR0Configuration> {
		const result = new Set<LR0Configuration>();

		for (const c of s.toArray()) {
			result.add(c.ToLR0Configuration());
		}

		return result;
	}

	private CognateHelper(
		s: IImmutableSet<LALR1Configuration>,
		cognateResult: Set<LALR1Configuration>,
		configDict: Map<LR0Configuration, LALR1Configuration>
	): void {
		for (const c of s.toArray()) {
			const lr0Config = c.ToLR0Configuration();
			const c2 = configDict.get(lr0Config);

			if (typeof c2 !== 'undefined') {
				if (!c.Lookaheads.isASubsetOf(c2.Lookaheads)) {
					// Note: This probably changes the hash code of c2; cognateResult may need to be rehashed, if possible.
					// A better solution: Remove c2 from cognateResult before modifying c2, and re-add it afterwards:
					cognateResult.remove(c2);
					c2.Lookaheads.unionInPlace(c.Lookaheads);
					cognateResult.add(c2);
				}
			} else {
				cognateResult.add(c);
				configDict.set(lr0Config, c);
			}
		}
	}

	// See Fischer and LeBlanc, page 167.

	private Cognate1(
		s_bar: IImmutableSet<LR0Configuration>,
		stateList: IImmutableSet<LALR1Configuration>[]
	): IImmutableSet<LALR1Configuration> {
		const result = new Set<LALR1Configuration>();
		const configDict = new Map<LR0Configuration, LALR1Configuration>();

		for (const s of stateList) {
			const s_core = this.Core(s);

			// if (!s_bar.IsSubsetOf(s_core) || !s_core.IsSubsetOf(s_bar))
			if (!s_bar.equals(s_core)) {
				continue;
			}

			// Solution 1:
			//result.UnionWith(s);    // Question: Could this inadvertently cause result to contain multiple configurations that differ only by lookahead?

			// Solution 2:
			this.CognateHelper(s, result, configDict);
		}

		return result;
	}

	private Cognate2(s_bar: CFSMState, lalr1machine: LALR1CFSM): IImmutableSet<LALR1Configuration> {
		const result = new Set<LALR1Configuration>();
		const configDict = new Map<LR0Configuration, LALR1Configuration>();

		for (const s of lalr1machine.StateList) {
			const s_core = this.Core(s.ConfigurationSet);

			if (!s_bar.ConfigurationSet.equals(s_core)) {
				continue;
			}

			// Solution 1:
			//result.UnionWith(s.ConfigurationSet);    // Question: Could this inadvertently cause result to contain multiple configurations that differ only by lookahead?

			// Solution 2:
			this.CognateHelper(s.ConfigurationSet, result, configDict);
		}

		return result;
	}

	private BuildLALR1CFSM(): void {
		if (this.machine.StateList.length === 0) {
			throw new InternalErrorException('machine.StateList is empty');
		}

		// 1) Create the machine object with all of its states.
		// See Fischer and LeBlanc, page 167.

		// 1a) Create the start state so that the machine object can be created.
		const stateList: IImmutableSet<LALR1Configuration>[] = [];
		const lr1parser = new LR1Parser(this.grammar);

		for (const lr1State of lr1parser.machine.StateList) {
			const cs = new Set<LALR1Configuration>();

			for (const c of lr1State.ConfigurationSet) {
				cs.add(LALR1Configuration.fromLR1(c));
			}

			stateList.push(cs);
		}

		for (const lr0state of this.machine.StateList) {
			this.cognateDict.set(
				lr0state.toString(),
				this.Cognate1(lr0state.ConfigurationSet, stateList)
			);
		}

		const ss = this.cognateDict.get(this.machine.StartState.toString());

		if (typeof ss === 'undefined') {
			throw new InternalErrorException('ss is undefined');
		}

		const startState = new LALR1CFSMState(ss);
		const result = new LALR1CFSM(startState);

		// 1b) Create the other states.

		for (const lr0state of this.machine.StateList) {
			const cognate = this.cognateDict.get(lr0state.toString());

			if (typeof cognate === 'undefined') {
				throw new InternalErrorException('cognate is undefined');
			}

			const lalr1State = new LALR1CFSMState(cognate);

			// if (!result.StateList.Contains(lalr1State))
			if (
				typeof result.StateList.find((s: LALR1CFSMState) => lalr1State.equals(s)) ===
				'undefined'
			) {
				result.StateList.push(lalr1State);
			}
		}

		// 2) Add the transitions.

		if (result.StateList.length === 0) {
			throw new InternalErrorException('result.StateList is empty');
		}

		for (const lr0state of this.machine.StateList) {
			const cognate2 = this.cognateDict.get(lr0state.toString());

			if (typeof cognate2 === 'undefined') {
				throw new InternalErrorException('cognate2 is undefined');
			}

			const lalr1State = result.FindStateWithLabel(cognate2);

			if (typeof lalr1State === 'undefined') {
				throw new InternalErrorException('lalr1State is undefined');
			}

			const transitionsKeys = Array.from(lr0state.Transitions.keys());

			// if (transitionsKeys.length === 0) {
			// 	// BUG 2021-08-09 : It blows up here.
			// 	console.error('List of transitionsKeys is empty');
			// 	console.error('lr0state is:', lr0state);
			// 	console.error('lr0state.Transitions is:', lr0state.Transitions);
			// 	throw new InternalErrorException('List of transitionsKeys is empty');
			// }

			for (const symbol of transitionsKeys) {
				const transition = lr0state.Transitions.get(symbol);

				if (typeof transition === 'undefined') {
					throw new InternalErrorException('transition is undefined');
				}

				const cognate3 = this.cognateDict.get(transition.toString());

				if (typeof cognate3 === 'undefined') {
					throw new InternalErrorException('cognate3 is undefined');
				}

				const lalr1StateDest = result.FindStateWithLabel(cognate3);

				// BUG 2021-08-09 : It seems like no transitions are being set. (When unit testing with the Chapter1 grammar.)
				lalr1State.Transitions.set(symbol, lalr1StateDest);
			}

			// if (lalr1State.Transitions.size === 0) {
			// 	throw new InternalErrorException('lalr1State.Transitions is empty');
			// }
		}

		// 3) Add the lookaheads.
		// See Fischer and LeBlanc, pages 171-173.

		for (const s of result.StateList) {
			for (const c of s.ConfigurationSet.toArray()) {
				c.Lookaheads.clear(); // Test; hack.  The real lookahead symbols will be added below.
			}
		}

		// 3a) Create the propagate links between configurations:
		//   i) When one configuration is created from another in a previous state via a shift operation.

		for (const s of result.StateList) {
			for (const c of s.ConfigurationSet.toArray()) {
				const symbol = c.FindSymbolAfterDot();

				if (typeof symbol === 'undefined') {
					continue;
				}

				const nextState = s.Transitions.get(symbol);

				if (typeof nextState === 'undefined') {
					continue;
				}

				const configurationToMatch = c.AdvanceDot();

				for (const cNext of nextState.ConfigurationSet.toArray()) {
					if (cNext.equals(configurationToMatch)) {
						c.PropagateLinks.add(cNext);
						break;
					}
				}
			}
		}

		//   ii) When a configuration is created as a result of a closure or prediction operation on another configuration.
		//     - A -> dot alpha, L2; B -> beta dot A gamma, L1
		//       - ThAW note: It appears that these two configurations will always be in the same state if the first conf results from the closure of the second.
		//         ? Is this also true in the case of prediction?
		//     1) Spontaneous: L2 = First(gamma), which does not include lambda.
		//     2) Propagate: When gamma can derive lambda.

		for (const s of result.StateList) {
			for (const c of s.ConfigurationSet.toArray()) {
				const symbol = c.FindSymbolAfterDot();

				if (typeof symbol === 'undefined') {
					continue;
				}

				for (const cNext of s.ConfigurationSet.toArray()) {
					if (cNext.ProductionLHS !== symbol || cNext.FindDot() !== 0) {
						continue;
					}

					// cNext is of the form "A -> dot alpha", where A == symbol.

					const gamma = c.FindSuffix(1);

					if (typeof gamma === 'undefined') {
						continue;
					}

					const firstOfGamma = this.computeFirst(gamma);
					const gammaCanDeriveLambda = firstOfGamma.contains(Symbol.Lambda);

					if (gammaCanDeriveLambda) {
						// Propagate (adjective) lookaheads.
						c.PropagateLinks.add(cNext);

						// Should we also add the non-lambda members of firstOfGamma to cNext.Lookaheads?
						firstOfGamma.remove(Symbol.Lambda);
					}

					cNext.Lookaheads.unionInPlace(firstOfGamma); // Add spontaneous lookaheads.
				}
			}
		}

		// 3b) Add the spontaneous lookaheads: the non-lambda values of First(gamma). : Done above.
		//  - Also initialize the lookahead set of the initial configuration to the empty set. : Done by default.

		// 3c) Propagate the lookaheads.
		const lookaheadPropagationStack = new Stack<LookaheadPropagationRecord>();

		for (const s of result.StateList) {
			for (const c of s.ConfigurationSet.toArray()) {
				for (const l of c.Lookaheads.toArray()) {
					lookaheadPropagationStack.push(new LookaheadPropagationRecord(c, l));
				}
			}
		}

		while (!lookaheadPropagationStack.isEmpty()) {
			const lpr = lookaheadPropagationStack.pop();

			for (const cLinked of lpr.configuration.PropagateLinks.toArray()) {
				if (!cLinked.Lookaheads.contains(lpr.lookahead)) {
					cLinked.Lookaheads.add(lpr.lookahead);
					lookaheadPropagationStack.push(
						new LookaheadPropagationRecord(cLinked, lpr.lookahead)
					);
				}
			}
		}

		// Clear cognateDict and re-populate it with configurations from the newly created LALR(1) machine
		// in order to ensure that the values of cognateDict contain all of the correct lookaheads?

		this.cognateDict.clear();

		for (const lr0state of this.machine.StateList) {
			this.cognateDict.set(lr0state.toString(), this.Cognate2(lr0state, result));
		}
	}

	// Adapted from Fischer and LeBlanc, pages 167-168.

	private GetActionLALR(
		S: CFSMState,
		tokenAsSymbol: Symbol
	): { reduceProductionNum: number; action: ShiftReduceAction } {
		let result = ShiftReduceAction.Error;
		let reduceResultFound = false; // In order for the grammar to be LALR(1), there must be at most one result per state-symbol pair.
		let reduceProductionNum = -1;

		// console.log('GetActionLALR() : S is', S);
		// console.log('GetActionLALR() : S.toString() is', S.toString());

		// console.log('GetActionLALR() : cognateDict size is', this.cognateDict.size);

		// 1) Search for Reduce actions.
		const cognateS = this.cognateDict.get(S.toString());

		if (typeof cognateS === 'undefined') {
			throw new InternalErrorException('GetActionLALR() : cognateS is undefined');
		}

		// console.log('GetActionLALR() : cognateS is', typeof cognateS, cognateS);
		// console.log('GetActionLALR() : cognateS.toArray().length is', cognateS.toArray().length);

		for (const c of cognateS.toArray()) {
			// console.log('GetActionLALR() : tokenAsSymbol is', tokenAsSymbol, Symbol[tokenAsSymbol]);
			// console.log('GetActionLALR() : c.Lookaheads is', c.Lookaheads);

			// for (const l of c.Lookaheads) {
			// 	console.log('GetActionLALR() : lookahead in c.Lookaheads is', l, Symbol[l]);
			// }

			if (!c.Lookaheads.contains(tokenAsSymbol)) {
				continue;
			}

			const matchedProduction = c.ConvertToProductionIfAllMatched();

			// console.log(`GetActionLALR() : matchedProduction is ${matchedProduction}`);

			if (typeof matchedProduction === 'undefined') {
				continue;
			}

			for (let i = 0; i < this.grammar.productions.length; ++i) {
				const productionToCompare = this.grammar.productions[i].StripOutSemanticActions();

				if (matchedProduction.equals(productionToCompare)) {
					if (reduceResultFound && reduceProductionNum !== i) {
						throw new ReduceReduceConflictException(
							`GetActionLALR() : Multiple actions found: productions ${this.grammar.productions[reduceProductionNum]} and ${this.grammar.productions[i]}; grammar is not LALR(1).`
						);
					}

					result = ShiftReduceAction.Reduce;
					reduceProductionNum = i;
					reduceResultFound = true;
				}
			}
		}

		// 2) Search for Shift and Accept actions.
		const shiftOrAcceptResultFound = S.ConfigurationSet.toArray().some(
			(c: LR0Configuration) => c.FindSymbolAfterDot() === tokenAsSymbol
		);

		if (shiftOrAcceptResultFound) {
			if (reduceResultFound) {
				const configurationToShift = S.ConfigurationSet.toArray().find(
					(c: LR0Configuration) => c.FindSymbolAfterDot() === tokenAsSymbol
				);

				throw new ShiftReduceConflictException(
					`GetActionLALR() : Multiple actions found: shift: ${configurationToShift}; reduce: ${this.grammar.productions[reduceProductionNum]}; grammar is not LALR(1).`
				);
			}

			result =
				tokenAsSymbol == Symbol.terminalEOF
					? ShiftReduceAction.Accept
					: ShiftReduceAction.Shift;
		}

		return {
			reduceProductionNum,
			action: result
		};
	}

	protected override GetActionCaller(
		S: CFSMState,
		tokenAsSymbol: Symbol
	): { reduceProductionNum: number; action: ShiftReduceAction } {
		return this.GetActionLALR(S, tokenAsSymbol);
	}
}

/* eslint-enable @typescript-eslint/ban-types */
