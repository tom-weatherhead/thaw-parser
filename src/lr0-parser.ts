// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Text;

// namespace Inference.Parser
// {
//     #region LR0Configuration

import { IEqualityComparable, Set, Stack } from 'thaw-common-utilities.ts';

import { Token } from 'thaw-lexical-analyzer';

import { GrammarException, IGrammar, Production, Symbol } from 'thaw-grammar';

// import { ParserException } from './exceptions/parser-exception';
// import { IParser } from './iparser';
import { ParserBase } from './parser-base';

export enum ShiftReduceAction {
	Error,
	Accept,
	Shift,
	Reduce
}

/* eslint-disable @typescript-eslint/ban-types */
export class LR0Configuration implements IEqualityComparable {
	public static fromProduction(p: Production): LR0Configuration {
		return new LR0Configuration(p.lhs, [Symbol.Dot, ...p.RHSWithNoSemanticActions()]);
	}

	public readonly ProductionLHS: Symbol;
	public readonly ProductionRHS: Symbol[] = []; // Will contain exactly one instance of the symbol Dot.

	// constructor(lhs: Symbol) {
	// 	this.ProductionLHS = lhs;
	// }

	constructor(lhs: Symbol, rhs: Symbol[] = []) {
		this.ProductionLHS = lhs;
		this.ProductionRHS = rhs.slice(0); // Clone the array
	}

	// constructor(LR0Configuration src) {	// Copy constructor.
	// 	this(src.ProductionLHS, src.ProductionRHS)
	// }

	// constructor(p: Production) {
	// 	this.ProductionLHS = p.lhs;
	// 	this.ProductionRHS.Add(Symbol.Dot);
	// 	this.ProductionRHS.AddRange(p.RHSWithNoSemanticActions());
	// }

	public toString(): string {
		// var sb = new StringBuilder();

		// sb.Append(lhs.ToString() + " ->");

		// for each (object o in rhs)
		// {
		// sb.Append(" " + o.ToString());
		// }

		// return sb.ToString();

		return `${this.ProductionLHS} -> ${this.ProductionRHS.join(' ')}`;
	}

	// public override bool Equals(object obj)
	// {

	//     if (object.ReferenceEquals(this, obj))
	//     {
	//         return true;
	//     }

	//     var that = obj as LR0Configuration;

	//     if (that == null || ProductionLHS != that.ProductionLHS || ProductionRHS.Count != that.ProductionRHS.Count)
	//     {
	//         return false;
	//     }

	//     for (int i = 0; i < ProductionRHS.Count; ++i)
	//     {

	//         if (ProductionRHS[i] != that.ProductionRHS[i])
	//         {
	//             return false;
	//         }
	//     }

	//     return true;
	// }

	public equals(other: unknown): boolean {
		const otherConfig = other as LR0Configuration;

		if (
			typeof otherConfig === 'undefined' ||
			!(other instanceof LR0Configuration) ||
			this.ProductionLHS !== otherConfig.ProductionLHS ||
			this.ProductionRHS.length !== otherConfig.ProductionRHS.length
		) {
			return false;
		}

		for (let i = 0; i < this.ProductionRHS.length; i++) {
			if (this.ProductionRHS[i] !== otherConfig.ProductionRHS[i]) {
				return false;
			}
		}

		return true;
	}

	// public override int GetHashCode()
	// {
	//     /*
	//     int hashCode = ProductionLHS.GetHashCode();

	//     for each (Symbol symbol in ProductionRHS)
	//     {
	//         hashCode *= 101;
	//         hashCode += symbol.GetHashCode();
	//     }

	//     return hashCode;
	//      */
	//     return ProductionRHS
	//         .Select(symbol => symbol.GetHashCode())
	//         .Aggregate(ProductionLHS.GetHashCode(), (accumulator, hashCode) => accumulator * 101 + hashCode);
	// }

	public FindDot(): number {
		return this.ProductionRHS.findIndex((symbol: Symbol) => symbol === Symbol.Dot);

		// for (int i = 0; i < ProductionRHS.Count; ++i)
		// {

		// if (ProductionRHS[i] == Symbol.Dot)
		// {
		//     return i;
		// }
		// }

		// return -1;
	}

	// public FindSymbolAfterDot(out Symbol symbol): boolean {
	public FindSymbolAfterDot(): Symbol | undefined {
		const i = this.FindDot();

		if (i >= 0 && i < this.ProductionRHS.length - 1) {
			return this.ProductionRHS[i + 1];
		}

		return undefined;
	}

	public FindSuffix(numSymbolsToSkipAfterDot: number): Symbol[] | undefined {
		const i = this.FindDot();

		if (i < 0) {
			return undefined;
		}

		/*
		List<Symbol> rho = new List<Symbol>();

		i += numSymbolsToSkipAfterDot + 1;

		while (i < ProductionRHS.Count)
		{
		rho.Add(ProductionRHS[i++]);
		}

		return rho;
		*/

		// return this.ProductionRHS.Skip(i + numSymbolsToSkipAfterDot + 1).ToList();
		return this.ProductionRHS.slice(i + numSymbolsToSkipAfterDot + 1);
	}

	public AdvanceDot(): LR0Configuration {
		const dotIndex = this.FindDot();

		if (dotIndex < 0) {
			throw new Error('LR0Configuration.AdvanceDot() : No dot found.'); // InternalErrorException
		}

		const newRHS = this.ProductionRHS.filter((symbol: Symbol) => symbol !== Symbol.Dot);
		const newConf = new LR0Configuration(this.ProductionLHS, newRHS);

		if (dotIndex >= this.ProductionRHS.length - 1) {
			throw new Error(
				'LR0Configuration.AdvanceDot() : The dot cannot be advanced any further.'
			); // InternalErrorException
		}

		// newConf.ProductionRHS.Insert(dotIndex + 1, Symbol.Dot); // splice
		newConf.ProductionRHS.splice(dotIndex + 1, 0, Symbol.Dot);

		return newConf;
	}

	public ConvertToProductionIfAllMatched(): Production | undefined {
		const dotIndex = this.FindDot();

		if (
			this.ProductionRHS.length === 2 &&
			dotIndex === 0 &&
			this.ProductionRHS[1] === Symbol.Lambda
		) {
			// A necessary hack.
			return new Production(this.ProductionLHS, [Symbol.Lambda], 0);
		}

		if (dotIndex !== this.ProductionRHS.length - 1) {
			return undefined;
		}

		// const rhs: (string | Symbol)[] = [];

		// .For Each(symbol => rhs.Add(symbol)) is used because rhs is of type List<object>, not List<Symbol> .
		// this.ProductionRHS.filter(
		// 	(symbol: Symbol) => symbol !== Symbol.Dot
		// ).for Each((symbol: Symbol) => rhs.push(symbol));

		// return new Production(this.ProductionLHS, rhs);

		return new Production(
			this.ProductionLHS,
			this.ProductionRHS.filter((symbol: string | Symbol) => symbol !== Symbol.Dot)
		);
	}
}

export class CFSMState {
	public readonly ConfigurationSet: Set<LR0Configuration>;
	// The Transitions graph could contain cycles.
	public readonly Transitions = new Map<Symbol, CFSMState>();

	constructor(cs: Set<LR0Configuration>) {
		this.ConfigurationSet = cs;
	}

	public toString(): string {
		const configs = this.ConfigurationSet.toArray();

		configs.sort();

		return `[${configs.join()}]`;
	}

	public Equals(obj: unknown): boolean {
		// TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).

		// if (object.ReferenceEquals(this, obj)) {
		// 	return true;
		// }

		const that = obj as CFSMState;

		// TODO: Should we also consider Transitions.Keys?
		return (
			that !== undefined &&
			obj instanceof CFSMState &&
			this.ConfigurationSet.isASubsetOf(that.ConfigurationSet) &&
			that.ConfigurationSet.isASubsetOf(this.ConfigurationSet)
		);
	}

	// public override int GetHashCode()
	// {
	//     // TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).
	//     //int hashCode = 0;

	//     /*
	//     for each (LR0Configuration conf in ConfigurationSet)
	//     {
	//         // The order of the configurations in the set doesn't affect the hash code.
	//         hashCode += conf.GetHashCode();
	//     }
	//      */
	//     //ConfigurationSet.ToList().For Each(conf => hashCode += conf.GetHashCode());
	//     //return ConfigurationSet.Select(conf => conf.GetHashCode()).Sum();

	//     // "unchecked" suppresses the OverflowException.  Sum() always executes within a checked block, and may throw the exception.
	//     //return unchecked(ConfigurationSet.Select(conf => conf.GetHashCode()).Aggregate((accumulator, element) => accumulator + element));

	//     // The order of the configurations in the set doesn't affect the hash code.
	//     // Passing a seed of 0 to Aggregate() avoids a possible "sequence contains no elements" error.
	//     return ConfigurationSet.Select(conf => conf.GetHashCode()).Aggregate(0, (accumulator, element) => accumulator + element);

	//     // TODO: Should we also consider Transitions.Keys?
	//     //return hashCode;
	// }
}

export class CharacteristicFiniteStateMachine {
	public readonly StateList: CFSMState[] = [];
	public readonly StartState: CFSMState;
	public readonly ErrorState: CFSMState;

	constructor(ss: CFSMState) {
		this.StartState = ss;
		this.ErrorState = new CFSMState(new Set<LR0Configuration>());
		this.StateList.push(this.StartState);
		this.StateList.push(this.ErrorState);
	}

	public FindStateWithLabel(cs: Set<LR0Configuration>): CFSMState | undefined {
		// Returns null if no state has the given configuration set.
		return this.StateList.find(
			(state: CFSMState) =>
				cs.isASubsetOf(state.ConfigurationSet) && state.ConfigurationSet.isASubsetOf(cs)
		);
	}
}

class CFSMStateSymbolPair {
	public readonly state: CFSMState;
	public readonly symbol: Symbol;

	constructor(st: CFSMState, sy: Symbol) {
		this.state = st;
		this.symbol = sy;
	}

	public toString(): string {
		return `${this.state}, ${this.symbol}`;
	}

	public Equals(obj: unknown): boolean {
		// if (object.ReferenceEquals(this, obj)) {
		// 	return true;
		// }

		const that = obj as CFSMStateSymbolPair;

		return (
			typeof that !== 'undefined' &&
			obj instanceof CFSMStateSymbolPair &&
			this.state.Equals(that.state) &&
			this.symbol === that.symbol
		);
	}

	// public override int GetHashCode() {
	// 	return state.GetHashCode() * 101 + symbol.GetHashCode();
	// }
}

export class LR0Parser extends ParserBase {
	private readonly AllSymbols: Set<Symbol>;
	protected readonly machine: CharacteristicFiniteStateMachine;
	// private readonly GoToTable = new Map<CFSMStateSymbolPair, CFSMState>();
	// TODO: Implement CFSMStateSymbolPair.toString() and then:
	private readonly GoToTable = new Map<string, CFSMState>();
	private readonly startingProduction: Production;

	constructor(g: IGrammar) {
		super(g);

		this.AllSymbols = new Set<Symbol>(g.terminals.concat(g.nonTerminals));
		// this.AllSymbols.unionInPlace(g.nonTerminals);
		this.machine = this.build_CFSM();
		this.build_go_to_table();
		this.startingProduction = g.findStartingProduction(); // No need to .StripOutSemanticActions(); they have already been removed.
	}

	// constructor(GrammarSelector gs)
	//     : this(GrammarFactory.Create(gs))
	// {
	// }

	public get NumberOfStates(): number {
		return this.machine.StateList.length;
	}

	// Adapted from Fischer and LeBlanc, page 146.

	private closure0(s: Set<LR0Configuration>): Set<LR0Configuration> {
		const sPrime = new Set<LR0Configuration>(s);
		const additions = new Set<LR0Configuration>();

		do {
			additions.clear();

			for (const conf1 of sPrime) {
				// Symbol A;
				const A = conf1.FindSymbolAfterDot();

				if (typeof A === 'undefined' || !this.grammar.nonTerminals.includes(A)) {
					continue;
				}

				for (const p of this.grammar.productions) {
					if (p.lhs !== A) {
						continue;
					}

					const addition = LR0Configuration.fromProduction(p);

					if (!sPrime.contains(addition) && !additions.contains(addition)) {
						additions.add(addition);
					}
				}
			}

			sPrime.unionInPlace(additions);
		} while (additions.size > 0);

		return sPrime;
	}

	// Adapted from Fischer and LeBlanc, page 147.

	private go_to0(s: Set<LR0Configuration>, X: Symbol): Set<LR0Configuration> {
		const sb = new Set<LR0Configuration>();

		for (const c of s) {
			const symbol = c.FindSymbolAfterDot();

			if (typeof symbol === 'undefined' || symbol !== X) {
				continue;
			}

			sb.add(c.AdvanceDot());
		}

		return this.closure0(sb);
	}

	// See Fischer and LeBlanc, page 147.

	private compute_s0(): Set<LR0Configuration> {
		const p = this.grammar.findStartingProduction();

		return this.closure0(new Set<LR0Configuration>([LR0Configuration.fromProduction(p)]));
	}

	// Adapted from Fischer and LeBlanc, page 148.

	private build_CFSM(): CharacteristicFiniteStateMachine {
		const s0 = this.compute_s0();
		const startState = new CFSMState(s0);
		const cfsm = new CharacteristicFiniteStateMachine(startState);
		const S = new Stack<Set<LR0Configuration>>();

		S.push(s0);

		while (S.size > 0) {
			const s = S.pop();

			// Consider both terminals and non-terminals.

			for (const X of this.AllSymbols) {
				const g = this.go_to0(s, X);

				/*
				if (g.Count == 0)
				{
				continue;
				}
				*/

				let stateG = cfsm.FindStateWithLabel(g);

				if (typeof stateG === 'undefined') {
					stateG = new CFSMState(g);
					cfsm.StateList.push(stateG);
					S.push(g);
				}

				// Create a transition under X from the state s labels to the state g labels.
				const stateS = cfsm.FindStateWithLabel(s);

				if (typeof stateS === 'undefined') {
					// ThAW 2021-06-28
					continue;
				}

				if (stateS.Transitions.has(X)) {
					throw new Error(
						'LR0Parser.build_CFSM() : Finite state machine transition is being overwritten.'
					); // InternalErrorException
				}

				stateS.Transitions.set(X, stateG);
			}
		}

		return cfsm;
	}

	// Adapted from Fischer and LeBlanc, pages 150-151.

	private GetAction(S: CFSMState): {
		reduceProductionNum: number;
		action: ShiftReduceAction;
	} {
		let result = ShiftReduceAction.Error;
		let reduceOrAcceptResultFound = false; // In order for the grammar to be LR(0), there must be at most one result per state-symbol pair.

		let reduceProductionNum = -1;

		// 1) Search for Reduce actions.

		for (const c of S.ConfigurationSet) {
			const matchedProduction = c.ConvertToProductionIfAllMatched();

			if (typeof matchedProduction === 'undefined') {
				continue;
			}

			for (let i = 0; i < this.grammar.productions.length; ++i) {
				const productionToCompare = this.grammar.productions[i].StripOutSemanticActions();

				if (matchedProduction.equals(productionToCompare)) {
					if (reduceOrAcceptResultFound && reduceProductionNum != i) {
						throw new Error(
							'GetAction() : Multiple actions found; grammar is not LR(0).'
						); // ReduceReduceConflictException
					}

					result = matchedProduction.equals(this.startingProduction)
						? ShiftReduceAction.Accept
						: ShiftReduceAction.Reduce;

					reduceProductionNum = i;
					reduceOrAcceptResultFound = true;
				}
			}
		}

		// 2) Search for Shift and Accept actions.
		/*
	    bool shiftResultFound = false;

	    for each (LR0Configuration c in S.ConfigurationSet)
	    {
	        Symbol symbol;

	        if (c.FindSymbolAfterDot(out symbol) && grammar.Terminals.Contains(symbol))
	        {
	            shiftResultFound = true;
	        }
	    }
	     */
		// let symbol: Symbol;
		const shiftResultFound = S.ConfigurationSet.toArray().some((c: LR0Configuration) => {
			const symbol = c.FindSymbolAfterDot();

			// c.FindSymbolAfterDot(out symbol) && this.grammar.terminals.Contains(symbol));
			return typeof symbol !== 'undefined' && this.grammar.terminals.includes(symbol);
		});

		if (shiftResultFound) {
			if (reduceOrAcceptResultFound) {
				throw new Error('GetAction() : Multiple actions found; grammar is not LR(0).'); // ShiftReduceConflictException
			}

			result = ShiftReduceAction.Shift;
		}

		/*
	    // Test:

	    if (result == ShiftReduceAction.Error)
	    {
	        StringBuilder sb = new StringBuilder();
	        string separator = string.Empty;

	        for each (Symbol transitionSymbol in S.Transitions.Keys)
	        {
	            sb.Append(separator);
	            sb.Append(transitionSymbol.ToString());
	            separator = ", ";
	        }

	        throw new Exception(string.Format("GetAction() error: transition keys = {0}", sb.ToString()));
	    }
	     */

		return {
			reduceProductionNum,
			action: result
		};
	}

	protected GetActionCaller(
		S: CFSMState,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		tokenAsSymbol: Symbol
	): { reduceProductionNum: number; action: ShiftReduceAction } {
		return this.GetAction(S);
	}

	// Adapted from Fischer and LeBlanc, page 150.

	private build_go_to_table(): void {
		this.GoToTable.clear();

		for (const S of this.machine.StateList) {
			for (const X of S.Transitions.keys()) {
				const value = S.Transitions.get(X);

				if (typeof value !== 'undefined') {
					const pair = new CFSMStateSymbolPair(S, X);

					// this.GoToTable.set(new CFSMStateSymbolPair(S, X), value);
					this.GoToTable.set(pair.toString(), value);
				}
			}
		}
	}

	public go_to(S: CFSMState, tokenAsSymbol: Symbol): CFSMState {
		const pair = new CFSMStateSymbolPair(S, tokenAsSymbol);
		const value = this.GoToTable.get(pair.toString());

		// if (!this.GoToTable.has(pair)) {
		if (typeof value === 'undefined') {
			throw new Error(`go_to() failed on token ${tokenAsSymbol}`); // InternalErrorException
		}

		return value;
	}

	// Adapted from Fischer and LeBlanc, page 142.

	private shift_reduce_driver(tokenList: Token[], parse: boolean): unknown {
		if (tokenList.length === 0) {
			throw new Error('Token list is empty'); // SyntaxException
		}

		let tokenNum = 0;
		let tokenAsSymbol = this.grammar.tokenToSymbol(tokenList[tokenNum]);
		const parseStack = new Stack<CFSMState>(); // The parse stack, which contains CFSM states.
		const semanticStack = new Stack<unknown>();

		parseStack.push(this.machine.StartState);

		while (parseStack.size > 0) {
			const S = parseStack.peek();
			// let reduceProductionNum: number;

			// Returns { reduceProductionNum: number; action: ShiftReduceAction; }
			const callerResult = this.GetActionCaller(S, tokenAsSymbol);
			const action = callerResult.action;
			const reduceProductionNum = callerResult.reduceProductionNum;
			let unstrippedProduction: Production;
			let numNonLambdaSymbols: number;

			switch (action) {
				case ShiftReduceAction.Accept:
					// console.log('Accept.');

					if (!parse) {
						return undefined;
					}

					// const semanticStackSize = semanticStack.size;

					if (semanticStack.size !== 1) {
						/*
	                    Console.WriteLine("Beginning of semantic stack dump:");

	                    while (semanticStack.Count > 0)
	                    {
	                        object o = semanticStack.Pop();

	                        if (o == null)
	                        {
	                            Console.WriteLine("  null");
	                        }
	                        else
	                        {
	                            Console.WriteLine("  {0}: {1}", o.GetType().FullName, o.ToString());
	                        }
	                    }

	                    Console.WriteLine("End of semantic stack dump.");
	                     */
						throw new GrammarException(
							`There were ${semanticStack.size} objects on the semantic stack; expected exactly one`
						);
					}

					return semanticStack.pop();

				case ShiftReduceAction.Shift:
					//Console.WriteLine("Shift: tokenAsSymbol is {0}.", tokenAsSymbol);   // Temporary debug code.
					// console.log(`Shift: tokenAsSymbol is ${tokenAsSymbol}.`);
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
						//throw new SyntaxException("Unexpected end of token list");
						tokenNum = tokenList.length - 1; // Hack.  Even after the last token has been shifted, we still need to reduce.  So stick around.
					}

					tokenAsSymbol = this.grammar.tokenToSymbol(tokenList[tokenNum]);

					break;

				case ShiftReduceAction.Reduce:
					if (
						reduceProductionNum < 0 ||
						reduceProductionNum >= this.grammar.productions.length
					) {
						throw new Error('Reduce: Invalid production number'); // InternalErrorException
					}

					unstrippedProduction = this.grammar.productions[reduceProductionNum];

					// console.log(
					// 	`Reduce: Production is ${unstrippedProduction}.`
					// );

					// Pop the production's non-Lambda symbols off of the parse stack.
					numNonLambdaSymbols = unstrippedProduction
						.RHSWithNoSemanticActions()
						.filter((s: Symbol) => s !== Symbol.Lambda).length;

					for (let i = 0; i < numNonLambdaSymbols; i++) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						// .for Each((symbol: Symbol) =>
						parseStack.pop();
					}

					// const SPrime = parseStack.peek();

					parseStack.push(this.go_to(parseStack.peek(), unstrippedProduction.lhs));

					if (parse && unstrippedProduction.rhs.length > 0) {
						// Grammar requirement: Every semantic action string appears at the end of a production.
						const semanticAction =
							unstrippedProduction.rhs[unstrippedProduction.rhs.length - 1]; // as string;

						// if (typeof semanticAction !== 'undefined') {
						if (typeof semanticAction === 'string') {
							this.grammar.executeSemanticAction(semanticStack, semanticAction);
						}
					}

					break;

				default:
					// I.e. Error
					throw new Error(
						`LR0Parser.shift_reduce_driver() : Syntax error at symbol ${Symbol[tokenAsSymbol]} value ${tokenList[tokenNum].tokenValue}, line ${tokenList[tokenNum].line}, column ${tokenList[tokenNum].column}.`
					); // SyntaxException
			}
		}

		throw new Error(
			'LR0Parser.shift_reduce_driver() : The parse stack is empty, but the Accept state has not been reached.'
		); // InternalErrorException
	}

	public recognize(tokenList: Token[]): void {
		// Throws an exception if an error is encountered.
		this.shift_reduce_driver(tokenList, false);
	}

	public parse(tokenList: Token[]): unknown {
		return this.shift_reduce_driver(tokenList, true);
	}
}
/* eslint-enable @typescript-eslint/ban-types */

//     #endregion
// }
