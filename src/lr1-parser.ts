// lr1-parser.ts

// #region ShiftReduceAction
//
// public enum ShiftReduceAction
// {
//     Error,
//     Accept,
//     Shift,
//     Reduce
// }
//
// #endregion

import { Set, Stack } from 'thaw-common-utilities.ts';

import { Token } from 'thaw-lexical-analyzer';

import { GrammarException, IGrammar, Production, Symbol } from 'thaw-grammar';

import { LR0Configuration, ShiftReduceAction } from './lr0-parser';

import { ParserBase } from './parser-base';

// #region LR1Configuration

/* eslint-disable @typescript-eslint/ban-types */
export class LR1Configuration extends LR0Configuration {
	public static fromLR0(src: LR0Configuration, look: Symbol): LR1Configuration {
		return new LR1Configuration(src.ProductionLHS, look, src.ProductionRHS);
	}

	public static fromProduction1(p: Production, look: Symbol): LR1Configuration {
		return new LR1Configuration(p.lhs, look, [Symbol.Dot, ...p.RHSWithNoSemanticActions()]);
	}

	public readonly Lookahead: Symbol;

	constructor(lhs: Symbol, look: Symbol, rhs: Symbol[] = []) {
		super(lhs, rhs);

		this.Lookahead = look;
	}

	// public LR1Configuration(LR0Configuration src, Symbol look)
	//     : base(src)
	// {
	//     Lookahead = look;
	// }
	//
	// public LR1Configuration(Production p, Symbol look)
	//     : base(p)
	// {
	//     Lookahead = look;
	// }

	// public override bool Equals(object obj)
	// {
	//
	//     if (object.ReferenceEquals(this, obj))
	//     {
	//         return true;
	//     }
	//
	//     LR0Configuration thatBase = obj as LR0Configuration;
	//     LR1Configuration that = obj as LR1Configuration;
	//
	//     return base.Equals(thatBase) && that != null && Lookahead == that.Lookahead;
	// }

	public override equals(other: unknown): boolean {
		const otherConfig = other as LR1Configuration;

		if (
			typeof otherConfig === 'undefined' ||
			!(other instanceof LR1Configuration) ||
			!super.equals(other) ||
			this.Lookahead !== otherConfig.Lookahead
		) {
			return false;
		}

		return true;
	}

	// public override int GetHashCode()
	// {
	//     return base.GetHashCode() * 101 + Lookahead.GetHashCode();  // ThAW 2013/05/08: The + was a second *
	// }

	public override toString(): string {
		return `${super.toString()}; ${this.Lookahead}`;
	}

	// The "new" keyword is used here because this function hides a function in the base class which differs only by return type.

	public override AdvanceDot(): LR1Configuration {
		return LR1Configuration.fromLR0(super.AdvanceDot(), this.Lookahead);
	}
}

// #endregion

// #region FSMState

export class FSMState {
	public readonly ConfigurationSet = new Set<LR1Configuration>();
	public readonly Transitions = new Map<Symbol, FSMState>();
	private readonly asString: string;

	constructor(cs: Set<LR1Configuration>) {
		this.ConfigurationSet = cs;

		const s = cs.toArray().map((c: LR1Configuration) => `${c}`);

		s.sort();

		this.asString = s.join(' ## ');
	}

	// public override bool Equals(object obj)
	public equals(other: unknown): boolean {
		// TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).
		// Note: The LR(1) parser works with the current code.

		// if (object.ReferenceEquals(this, obj))
		// {
		//     return true;
		// }

		const that = other as FSMState;

		// TODO: Should we also consider Transitions.Keys?
		return (
			typeof that !== 'undefined' &&
			this.ConfigurationSet.isASubsetOf(that.ConfigurationSet) &&
			that.ConfigurationSet.isASubsetOf(this.ConfigurationSet)
		);
	}

	// public override int GetHashCode()
	// {
	//     // TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).
	//     // Note: The LR(1) parser works with the current code.
	//     /*
	//     int hashCode = 0;
	//
	//     foreach (LR1Configuration conf in ConfigurationSet)
	//     {
	//         // The order of the configurations in the set doesn't affect the hash code.
	//         hashCode += conf.GetHashCode();
	//     }
	//
	//     // TODO: Should we also consider Transitions.Keys?
	//     return hashCode;
	//      */
	//
	//     // The order of the configurations in the set doesn't affect the hash code.
	//     return ConfigurationSet
	//         .Select(conf => conf.GetHashCode())
	//         .Aggregate(0, (accumulator, hashCode) => accumulator + hashCode);
	// }

	public toString(): string {
		// let s = this.ConfigurationSet.toArray().map((c: LR1Configuration) => `${c}`);
		//
		// s.sort();
		//
		// return s.join(' ## ');

		return this.asString;
	}
}

// #endregion

// #region FiniteStateMachine

export class FiniteStateMachine {
	public readonly StateList: FSMState[];
	public readonly StartState: FSMState;

	constructor(ss: FSMState) {
		this.StartState = ss;
		this.StateList = [ss]; // .Add(ss);
	}

	public FindStateWithLabel(cs: Set<LR1Configuration>): FSMState | undefined {
		// Returns null if no state has the given configuration set.
		return this.StateList.find(
			(state) =>
				cs.isASubsetOf(state.ConfigurationSet) && state.ConfigurationSet.isASubsetOf(cs)
		);
	}
}

// #endregion

// #region StateSymbolPair

export class StateSymbolPair {
	// public readonly state: FSMState;
	// public readonly symbol: Symbol;

	constructor(public readonly state: FSMState, public readonly symbol: Symbol) {
		// state = st;
		// symbol = sy;
	}

	// public override bool Equals(object obj)
	// {
	//
	//     // if (object.ReferenceEquals(this, obj))
	//     // {
	//     //     return true;
	//     // }
	//
	//     StateSymbolPair that = obj as StateSymbolPair;
	//
	//     return that != null && state.Equals(that.state) && symbol == that.symbol;
	// }

	public equals(other: unknown): boolean {
		const that = other as StateSymbolPair;

		return (
			typeof that !== 'undefined' &&
			this.state.equals(that.state) &&
			this.symbol === that.symbol
		);
	}

	// public override int GetHashCode()
	// {
	//     return state.GetHashCode() * 101 + symbol.GetHashCode();
	// }

	public toString(): string {
		return `${this.state} ++ ${this.symbol}`;
	}
}

// #endregion

// #region LR1Parser

export class LR1Parser extends ParserBase {
	private readonly AllSymbols: Set<Symbol>;
	public readonly machine: FiniteStateMachine;
	// private readonly GoToTable = new Map<StateSymbolPair, FSMState>();
	private readonly GoToTable = new Map<string, FSMState>();

	constructor(g: IGrammar) {
		super(g);

		this.AllSymbols = new Set<Symbol>(g.terminals.concat(g.nonTerminals));
		// this.AllSymbols.unionInPlace(g.nonTerminals);
		this.machine = this.build_LR1();
		this.build_go_to_table();
	}

	// public LR1Parser(GrammarSelector gs)
	//     : this(GrammarFactory.Create(gs))
	// {
	// }

	public get NumberOfStates(): number {
		return this.machine.StateList.length;
	}

	// Adapted from Fischer and LeBlanc, page 156.

	private closure1(s: Set<LR1Configuration>): Set<LR1Configuration> {
		const sPrime = new Set<LR1Configuration>(s);
		const additions = new Set<LR1Configuration>();

		do {
			additions.clear();

			for (const conf1 of sPrime) {
				const A = conf1.FindSymbolAfterDot();

				if (typeof A === 'undefined' || !this.grammar.nonTerminals.includes(A)) {
					continue;
				}

				const rho = conf1.FindSuffix(1);

				if (typeof rho === 'undefined') {
					continue;
				}

				const l = conf1.Lookahead;

				if (l !== Symbol.Lambda || rho.length === 0) {
					// Test
					rho.push(l); // Now rho is actually rho l.
				}

				const firstSet = this.computeFirst(rho);

				for (const p of this.grammar.productions) {
					if (p.lhs !== A) {
						continue;
					}

					for (const u of firstSet) {
						const addition = LR1Configuration.fromProduction1(
							p.StripOutSemanticActions(),
							u
						);

						if (!sPrime.contains(addition) && !additions.contains(addition)) {
							additions.add(addition);
						}
					}
				}
			}

			sPrime.unionInPlace(additions);
		} while (additions.size > 0);

		return sPrime;
	}

	// Adapted from Fischer and LeBlanc, page 157.

	private go_to1(s: Set<LR1Configuration>, X: Symbol): Set<LR1Configuration> {
		const sb = new Set<LR1Configuration>();

		for (const c of s) {
			const symbol = c.FindSymbolAfterDot();

			if (typeof symbol === 'undefined' || symbol !== X) {
				continue;
			}

			sb.add(c.AdvanceDot());
		}

		return this.closure1(sb);
	}

	// See Fischer and LeBlanc, page 157.

	private compute_s0(): Set<LR1Configuration> {
		const p = this.grammar.findStartingProduction();

		return this.closure1(
			new Set<LR1Configuration>([LR1Configuration.fromProduction1(p, Symbol.Lambda)])
		);
	}

	// Adapted from Fischer and LeBlanc, page 158.

	private build_LR1(): FiniteStateMachine {
		const s0 = this.compute_s0();
		const startState = new FSMState(s0);
		const fsm = new FiniteStateMachine(startState);
		const S = new Stack<Set<LR1Configuration>>();

		S.push(s0);

		while (S.size > 0) {
			const s = S.pop();

			// Consider both terminals and non-terminals.

			for (const X of this.AllSymbols) {
				const g = this.go_to1(s, X);

				/*
                if (g.Count == 0)
                {
                    continue;
                }
                 */

				let stateG = fsm.FindStateWithLabel(g);

				if (typeof stateG === 'undefined') {
					stateG = new FSMState(g);
					fsm.StateList.push(stateG);
					S.push(g);
				}

				// Create a transition under X from the state s labels to the state g labels.
				const stateS = fsm.FindStateWithLabel(s);

				if (typeof stateS === 'undefined') {
					continue;
				}

				if (stateS.Transitions.has(X)) {
					// InternalErrorException
					throw new Error(
						'LR1Parser.build_LR1() : Finite state machine transition is being overwritten.'
					);
				}

				stateS.Transitions.set(X, stateG);
			}
		}

		return fsm;
	}

	// Adapted from Fischer and LeBlanc, pages 158-159.

	// private GetAction(S: FSMState, tokenAsSymbol: Symbol, out int reduceProductionNum): ShiftReduceAction {
	private GetAction(
		S: FSMState,
		tokenAsSymbol: Symbol
	): {
		reduceProductionNum: number;
		action: ShiftReduceAction;
	} {
		let result = ShiftReduceAction.Error;
		let reduceResultFound = false; // In order for the grammar to be LR(1), there must be at most one result per state-symbol pair.
		let reduceProductionNum = -1;

		// 1) Search for Reduce actions.

		for (const c of S.ConfigurationSet) {
			if (c.Lookahead !== tokenAsSymbol) {
				continue;
			}

			const matchedProduction = c.ConvertToProductionIfAllMatched();

			if (typeof matchedProduction === 'undefined') {
				continue;
			}

			for (let i = 0; i < this.grammar.productions.length; ++i) {
				const productionToCompare = this.grammar.productions[i].StripOutSemanticActions();

				if (matchedProduction.equals(productionToCompare)) {
					if (reduceResultFound && reduceProductionNum != i) {
						// ReduceReduceConflictException
						throw new Error(
							'GetAction() : Multiple actions found; grammar is not LR(1).'
						);
					}

					result = ShiftReduceAction.Reduce;
					reduceProductionNum = i;
					reduceResultFound = true;
				}
			}
		}

		// 2) Search for Shift and Accept actions.
		// let symbol: Symbol;
		const shiftOrAcceptResultFound =
			typeof S.ConfigurationSet.toArray().find(
				(c: LR1Configuration) => c.FindSymbolAfterDot() === tokenAsSymbol
			) !== 'undefined';

		if (shiftOrAcceptResultFound) {
			if (reduceResultFound) {
				// ShiftReduceConflictException
				throw new Error('GetAction() : Multiple actions found; grammar is not LR(1).');
			}

			result =
				tokenAsSymbol === Symbol.terminalEOF
					? ShiftReduceAction.Accept
					: ShiftReduceAction.Shift;
		}

		// return result;

		return {
			reduceProductionNum,
			action: result
		};
	}

	// Adapted from Fischer and LeBlanc, page 150.

	private build_go_to_table(): void {
		this.GoToTable.clear();

		for (const S of this.machine.StateList) {
			for (const X of S.Transitions.keys()) {
				const value = S.Transitions.get(X);

				if (typeof value !== 'undefined') {
					this.GoToTable.set(new StateSymbolPair(S, X).toString(), value);
				}
			}
		}
	}

	private go_to(S: FSMState, tokenAsSymbol: Symbol): FSMState {
		const pair = new StateSymbolPair(S, tokenAsSymbol).toString();

		if (!this.GoToTable.has(pair)) {
			// InternalErrorException
			throw new Error(`go_to() failed on token ${tokenAsSymbol}`);
		}

		const result = this.GoToTable.get(pair);

		if (typeof result === 'undefined') {
			throw new Error(`LR1 go_to() : Failed to find the pair '${pair}' in the GoToTable.`);
		}

		return result;
	}

	// Adapted from Fischer and LeBlanc, page 142.

	private shift_reduce_driver(tokenList: Token[], parse: boolean): unknown {
		if (tokenList.length === 0) {
			// SyntaxException
			throw new Error('Token list is empty');
		}

		let tokenNum = 0;
		let tokenAsSymbol = this.grammar.tokenToSymbol(tokenList[tokenNum]);
		const parseStack = new Stack<FSMState>(); // The parse stack, which contains machine states.
		const semanticStack = new Stack<object>();

		parseStack.push(this.machine.StartState);

		while (parseStack.size > 0) {
			const S = parseStack.peek();
			// let reduceProductionNum: number;
			// const action = this.GetAction(S, tokenAsSymbol, out reduceProductionNum);
			const { reduceProductionNum, action } = this.GetAction(S, tokenAsSymbol);
			// reduceProductionNum: number;
			// action: ShiftReduceAction;
			const semanticStackSize = semanticStack.size;
			let SPrime: FSMState;
			let unstrippedProduction: Production;

			switch (action) {
				case ShiftReduceAction.Accept:
					if (!parse) {
						return undefined;
					}

					if (semanticStackSize !== 1) {
						console.log('Beginning of semantic stack dump:');

						while (semanticStack.size > 0) {
							const o = semanticStack.pop();

							if (typeof o === 'undefined') {
								console.log('  null');
							} else {
								console.log(`  o: ${o}`);
							}
						}

						console.log('End of semantic stack dump.');

						throw new GrammarException(
							`There were ${semanticStackSize} objects on the semantic stack; expected exactly one`
						);
					}

					return semanticStack.pop();

				case ShiftReduceAction.Shift:
					parseStack.push(this.go_to(S, tokenAsSymbol));

					if (parse) {
						this.grammar.pushTokenOntoSemanticStack(
							semanticStack,
							tokenAsSymbol,
							tokenList[tokenNum]
						);
					}

					// Get next token.
					++tokenNum;

					if (tokenNum >= tokenList.length) {
						// SyntaxException
						throw new Error('Unexpected end of token list');
					}

					tokenAsSymbol = this.grammar.tokenToSymbol(tokenList[tokenNum]);

					break;

				case ShiftReduceAction.Reduce:
					if (
						reduceProductionNum < 0 ||
						reduceProductionNum >= this.grammar.productions.length
					) {
						// InternalErrorException
						throw new Error('Reduce: Invalid production number');
					}

					unstrippedProduction = this.grammar.productions[reduceProductionNum];
					/*
                    Production p = unstrippedProduction.StripOutSemanticActions();

                    for (int i = 0; i < p.rhs.Count; ++i)
                    {

                        if (!p.rhs[i].Equals(Symbol.Lambda))    // Test; hack.
                        {
                            parseStack.Pop();
                        }
                    }
                     */

					// Pop the production's non-Lambda symbols off of the parse stack.
					unstrippedProduction
						.RHSWithNoSemanticActions()
						.filter((symbol: Symbol) => symbol !== Symbol.Lambda)
						.forEach(() => parseStack.pop());

					SPrime = parseStack.peek();

					parseStack.push(this.go_to(SPrime, unstrippedProduction.lhs));

					if (parse && unstrippedProduction.rhs.length > 0) {
						// Grammar requirement: Every semantic action string appears at the end of a production.
						const semanticAction = unstrippedProduction.rhs[
							unstrippedProduction.rhs.length - 1
						] as string;

						if (typeof semanticAction !== 'undefined') {
							this.grammar.executeSemanticAction(semanticStack, semanticAction);
						}
					}

					break;

				default:
					// I.e. Error
					// SyntaxException
					throw new Error(
						`LR1Parser.shift_reduce_driver() : Syntax error at symbol ${tokenAsSymbol}`
					);
				// tokenList[tokenNum].Line, tokenList[tokenNum].Column);
			}
		}

		// InternalErrorException
		throw new Error(
			'LR1Parser.shift_reduce_driver() : The parse stack is empty, but the Accept state has not been reached.'
		);
	}

	public override recognize(tokenList: Token[]): void {
		// Throws an exception if an error is encountered.
		this.shift_reduce_driver(tokenList, false);
	}

	public override parse(tokenList: Token[]): unknown {
		return this.shift_reduce_driver(tokenList, true);
	}
}

/* eslint-enable @typescript-eslint/ban-types */
