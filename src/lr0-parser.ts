// tom-weatherhead/thaw-parser/src/lr0-parser.ts

import {
	createSet,
	IEqualityComparable,
	IImmutableSet,
	ISet,
	Stack
} from 'thaw-common-utilities.ts';

import {
	GrammarSymbol,
	IGrammar,
	IProduction,
	IToken,
	ProductionRhsElementType
} from 'thaw-interpreter-types';

import { InternalErrorException } from './exceptions/internal-error';
import { ReduceReduceConflictException } from './exceptions/reduce-reduce-conflict';
import { ShiftReduceConflictException } from './exceptions/shift-reduce-conflict';
import { ParserException } from './exceptions/parser';
import { SyntaxException } from './exceptions/syntax';

import { ParserBase } from './parser-base';

import { ShiftReduceAction } from './shift-reduce-actions';

export class LR0Configuration implements IEqualityComparable {
	public static fromProduction(p: IProduction): LR0Configuration {
		return new LR0Configuration(p.lhs, [GrammarSymbol.Dot, ...p.getRHSWithNoSemanticActions()]);
	}

	public readonly ProductionLHS: GrammarSymbol;
	public readonly ProductionRHS: GrammarSymbol[] = []; // Will contain exactly one instance of the symbol Dot.

	constructor(lhs: GrammarSymbol, rhs: GrammarSymbol[] = []) {
		this.ProductionLHS = lhs;
		this.ProductionRHS = rhs.slice(0); // Clone the array
	}

	public toString(): string {
		const fn = (ss: GrammarSymbol | string) =>
			typeof ss === 'string' ? ss : GrammarSymbol[ss];

		return `${fn(this.ProductionLHS)} -> ${this.ProductionRHS.map(fn).join(' ')}`;
	}

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

	public FindDot(): number {
		return this.ProductionRHS.findIndex(
			(symbol: GrammarSymbol) => symbol === GrammarSymbol.Dot
		);
	}

	public FindSymbolAfterDot(): GrammarSymbol | undefined {
		const i = this.FindDot();

		if (i >= 0 && i < this.ProductionRHS.length - 1) {
			return this.ProductionRHS[i + 1];
		}

		return undefined;
	}

	public FindSuffix(numSymbolsToSkipAfterDot: number): GrammarSymbol[] | undefined {
		const i = this.FindDot();

		if (i < 0) {
			return undefined;
		}

		return this.ProductionRHS.slice(i + numSymbolsToSkipAfterDot + 1);
	}

	public AdvanceDot(): LR0Configuration {
		const dotIndex = this.FindDot();

		if (dotIndex < 0) {
			throw new InternalErrorException('LR0Configuration.AdvanceDot() : No dot found.');
		}

		const newRHS = this.ProductionRHS.filter(
			(symbol: GrammarSymbol) => symbol !== GrammarSymbol.Dot
		);
		const newConf = new LR0Configuration(this.ProductionLHS, newRHS);

		if (dotIndex >= this.ProductionRHS.length - 1) {
			throw new InternalErrorException(
				'LR0Configuration.AdvanceDot() : The dot cannot be advanced any further.'
			);
		}

		newConf.ProductionRHS.splice(dotIndex + 1, 0, GrammarSymbol.Dot);

		return newConf;
	}

	public ConvertToProductionIfAllMatched(): IProduction | undefined {
		const dotIndex = this.FindDot();

		if (
			this.ProductionRHS.length === 2 &&
			dotIndex === 0 &&
			this.ProductionRHS[1] === GrammarSymbol.Lambda
		) {
			// A necessary hack.
			// return createProduction(this.ProductionLHS, [GrammarSymbol.Lambda], 0);

			// (1 of 2) Here, we fake the creation of a Production withouut calling
			// createProduction so that thaw-parser will not depend on thaw-grammar.

			return {
				lhs: this.ProductionLHS,
				rhs: [GrammarSymbol.Lambda],
				// readonly num: 0,
				getRHSWithNoSemanticActions: () => [GrammarSymbol.Lambda],
				stripOutSemanticActions: () => {
					throw new Error(
						'LR0 ConvertToProductionIfAllMatched() : necessary hack : stripOutSemanticActions()'
					);
				},
				containsSymbol: (symbol: GrammarSymbol) =>
					symbol === this.ProductionLHS || symbol === GrammarSymbol.Lambda,
				toString: () => `0: ${this.ProductionLHS} -> Lambda`,
				equals: (other: unknown) => {
					const otherProduction = other as IProduction;

					return (
						otherProduction.lhs === this.ProductionLHS &&
						otherProduction.rhs.length === 1 &&
						otherProduction.rhs[0] === GrammarSymbol.Lambda
					);
				}
			};
		}

		if (dotIndex !== this.ProductionRHS.length - 1) {
			return undefined;
		}

		// return createProduction(
		// 	this.ProductionLHS,
		// 	this.ProductionRHS.filter(
		// 		(symbol: string | GrammarSymbol) => symbol !== GrammarSymbol.Dot
		// 	)
		// );

		// (2 of 2) Here, we fake the creation of a Production withouut calling
		// createProduction so that thaw-parser will not depend on thaw-grammar.

		const newRHS = this.ProductionRHS.filter(
			(symbol: string | GrammarSymbol) => symbol !== GrammarSymbol.Dot
		);
		const newRHSWithNoSemanticActions = newRHS
			.filter((s: ProductionRhsElementType) => typeof s !== 'string')
			.map((s: ProductionRhsElementType) => s as GrammarSymbol);

		return {
			lhs: this.ProductionLHS,
			rhs: newRHS,
			// readonly num: 0,
			getRHSWithNoSemanticActions: () => newRHSWithNoSemanticActions,
			stripOutSemanticActions: () => {
				throw new Error(
					'LR0 ConvertToProductionIfAllMatched() : necessary hack part 2 : stripOutSemanticActions()'
				);
			},
			containsSymbol: (symbol: GrammarSymbol) =>
				symbol === this.ProductionLHS ||
				typeof newRHS.find((s: ProductionRhsElementType) => s === symbol) !== 'undefined',
			// toString: () => `0: ${this.ProductionLHS} -> Lambda`,
			toString: () => 'Grrr. Arrrgh.',
			equals: (other: unknown) => {
				const otherProduction = other as IProduction;

				return (
					otherProduction.lhs === this.ProductionLHS &&
					otherProduction.rhs.length === newRHS.length &&
					newRHS.every((s, i: number) => s === otherProduction.rhs[i])
				);
			}
		};
	}
}

export class CFSMState {
	// public readonly ConfigurationSet: Set<LR0Configuration>;
	// The Transitions graph could contain cycles.
	public readonly Transitions = new Map<GrammarSymbol, CFSMState>();

	constructor(public readonly ConfigurationSet: IImmutableSet<LR0Configuration>) {
		// this.ConfigurationSet = cs;
	}

	public toString(): string {
		const configs = this.ConfigurationSet.toArray();

		configs.sort();

		return `[${configs.join()}]`;
	}

	public Equals(obj: unknown): boolean {
		// TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).

		const that = obj as CFSMState;

		// TODO: Should we also consider Transitions.Keys?
		return (
			that !== undefined &&
			obj instanceof CFSMState &&
			this.ConfigurationSet.equals(that.ConfigurationSet)
		);
	}
}

export class CharacteristicFiniteStateMachine {
	public readonly StateList: CFSMState[] = [];
	public readonly StartState: CFSMState;
	public readonly ErrorState: CFSMState;

	constructor(ss: CFSMState) {
		this.StartState = ss;
		this.ErrorState = new CFSMState(createSet<LR0Configuration>());
		this.StateList.push(this.StartState);
		this.StateList.push(this.ErrorState);
	}

	public FindStateWithLabel(cs: IImmutableSet<LR0Configuration>): CFSMState | undefined {
		// Returns undefined if no state has the given configuration set.
		return this.StateList.find((state: CFSMState) => cs.equals(state.ConfigurationSet));
	}
}

class CFSMStateSymbolPair {
	public readonly state: CFSMState;
	public readonly symbol: GrammarSymbol;

	constructor(st: CFSMState, sy: GrammarSymbol) {
		this.state = st;
		this.symbol = sy;
	}

	public toString(): string {
		return `${this.state}, ${this.symbol}`;
	}

	public Equals(obj: unknown): boolean {
		const that = obj as CFSMStateSymbolPair;

		return (
			typeof that !== 'undefined' &&
			obj instanceof CFSMStateSymbolPair &&
			this.state.Equals(that.state) &&
			this.symbol === that.symbol
		);
	}
}

export class LR0Parser extends ParserBase {
	private readonly AllSymbols: IImmutableSet<GrammarSymbol>;
	protected readonly machine: CharacteristicFiniteStateMachine;
	private readonly GoToTable = new Map<string, CFSMState>();
	private readonly startingProduction: IProduction;

	constructor(g: IGrammar) {
		super(g);

		this.AllSymbols = createSet<GrammarSymbol>(g.terminals.concat(g.nonTerminals));
		this.machine = this.build_CFSM();
		this.build_go_to_table();
		this.startingProduction = g.findStartingProduction(); // No need to .StripOutSemanticActions(); they have already been removed.
	}

	public get NumberOfStates(): number {
		return this.machine.StateList.length;
	}

	// Adapted from Fischer and LeBlanc, page 146.

	private closure0(s: IImmutableSet<LR0Configuration>): ISet<LR0Configuration> {
		const sPrime = createSet<LR0Configuration>(s);
		const additions = createSet<LR0Configuration>();

		do {
			additions.clear();

			for (const conf1 of sPrime) {
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

	private go_to0(s: IImmutableSet<LR0Configuration>, X: GrammarSymbol): ISet<LR0Configuration> {
		const sb = createSet<LR0Configuration>();

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

	private compute_s0(): ISet<LR0Configuration> {
		const p = this.grammar.findStartingProduction();

		return this.closure0(createSet<LR0Configuration>([LR0Configuration.fromProduction(p)]));
	}

	// Adapted from Fischer and LeBlanc, page 148.

	private build_CFSM(): CharacteristicFiniteStateMachine {
		const s0 = this.compute_s0();
		const startState = new CFSMState(s0);
		const cfsm = new CharacteristicFiniteStateMachine(startState);
		const S = new Stack<ISet<LR0Configuration>>();

		S.push(s0);

		while (S.size > 0) {
			const s = S.pop();

			// Consider both terminals and non-terminals.

			for (const X of this.AllSymbols) {
				const g = this.go_to0(s, X);

				// if (g.Count == 0) {
				// 	continue;
				// }

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
					throw new InternalErrorException(
						'LR0Parser.build_CFSM() : Finite state machine transition is being overwritten.'
					);
				}

				stateS.Transitions.set(X, stateG);
			}
		}

		return cfsm;
	}

	// protected productionEquals(p1: Production, other: Production): boolean {
	// 	return p1.equals(other);
	// }

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
				const productionToCompare = this.grammar.productions[i].stripOutSemanticActions();

				// console.log(`Comparing prod ${matchedProduction} to ${productionToCompare} ...`);

				if (matchedProduction.equals(productionToCompare)) {
					// console.log(`Yay! Prod ${matchedProduction} matches ${productionToCompare}`);

					if (reduceOrAcceptResultFound && reduceProductionNum != i) {
						throw new ReduceReduceConflictException(
							'GetAction() : Multiple actions found; grammar is not LR(0).'
						);
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
		const shiftResultFound = S.ConfigurationSet.toArray().some((c: LR0Configuration) => {
			const symbol = c.FindSymbolAfterDot();

			return typeof symbol !== 'undefined' && this.grammar.terminals.includes(symbol);
		});

		if (shiftResultFound) {
			if (reduceOrAcceptResultFound) {
				throw new ShiftReduceConflictException(
					'GetAction() : Multiple actions found; grammar is not LR(0).'
				);
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
		tokenAsSymbol: GrammarSymbol
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

					this.GoToTable.set(pair.toString(), value);
				}
			}
		}
	}

	public go_to(S: CFSMState, tokenAsSymbol: GrammarSymbol): CFSMState {
		const pair = new CFSMStateSymbolPair(S, tokenAsSymbol);
		const value = this.GoToTable.get(pair.toString());

		if (typeof value === 'undefined') {
			throw new InternalErrorException(`go_to() failed on token ${tokenAsSymbol}`);
		}

		return value;
	}

	// Adapted from Fischer and LeBlanc, page 142.

	private shift_reduce_driver(tokenList: IToken[], parse: boolean): unknown {
		if (tokenList.length === 0) {
			throw new SyntaxException('Token list is empty');
		}

		// console.log('shift_reduce_driver(): Tokens are:');
		//
		// for (const t of tokenList) {
		// 	console.log(`Token: ${t.tokenValue} at ${t.line}, ${t.column}`);
		// }

		let tokenNum = 0;
		let token = tokenList[tokenNum];
		let tokenAsSymbol = this.grammar.tokenToSymbol(token);
		const parseStack = new Stack<CFSMState>(); // The parse stack, which contains CFSM states.
		const semanticStack = new Stack<unknown>();

		parseStack.push(this.machine.StartState);

		// console.log('shift_reduce_driver(): Initial parseStack.size is:', parseStack.size);

		while (parseStack.size > 0) {
			const S = parseStack.peek();

			// console.log(`S from parseStack.peek() is ${typeof S} ${S}`, S);

			// Returns { reduceProductionNum: number; action: ShiftReduceAction; }
			const callerResult = this.GetActionCaller(S, tokenAsSymbol);
			const action = callerResult.action;
			const reduceProductionNum = callerResult.reduceProductionNum;
			let unstrippedProduction: IProduction;
			let numNonLambdaSymbols: number;

			// console.log(
			// 	`callerResult.action is ${typeof callerResult.action} ${callerResult.action}`,
			// 	callerResult.action
			// );

			switch (action) {
				case ShiftReduceAction.Accept:
					// console.log('Accept.');

					if (!parse) {
						return undefined;
					}

					if (semanticStack.size !== 1) {
						throw new ParserException(
							`There were ${semanticStack.size} objects on the semantic stack; expected exactly one`
						);
					}

					return semanticStack.pop();

				case ShiftReduceAction.Shift:
					// console.log(
					// 	`Shift: tokenAsSymbol is ${tokenAsSymbol} ${Symbol[tokenAsSymbol]}`
					// );
					parseStack.push(this.go_to(S, tokenAsSymbol));

					if (parse) {
						this.grammar.pushTokenOntoSemanticStack(
							semanticStack,
							tokenAsSymbol,
							token
						);
					}

					// Get next token.
					++tokenNum;

					if (tokenNum >= tokenList.length) {
						//throw new SyntaxException("Unexpected end of token list");
						tokenNum = tokenList.length - 1; // Hack.  Even after the last token has been shifted, we still need to reduce.  So stick around.
					}

					token = tokenList[tokenNum];
					tokenAsSymbol = this.grammar.tokenToSymbol(token);

					break;

				case ShiftReduceAction.Reduce:
					// console.log(
					// 	`Reduce: tokenAsSymbol is ${tokenAsSymbol} ${Symbol[tokenAsSymbol]}`
					// );

					if (
						reduceProductionNum < 0 ||
						reduceProductionNum >= this.grammar.productions.length
					) {
						throw new InternalErrorException('Reduce: Invalid production number');
					}

					unstrippedProduction = this.grammar.productions[reduceProductionNum];

					// console.log(`Reduce: Production is ${unstrippedProduction}.`);
					// console.log(
					// 	`Reduce: Production RHSWithNoSemanticActions is ${unstrippedProduction.RHSWithNoSemanticActions()}.`
					// );

					// Pop the production's non-Lambda symbols off of the parse stack.
					numNonLambdaSymbols = unstrippedProduction
						.getRHSWithNoSemanticActions()
						.filter((s: GrammarSymbol) => s !== GrammarSymbol.Lambda).length;

					// console.log(`Reduce: numNonLambdaSymbols is ${numNonLambdaSymbols}.`);

					for (let i = 0; i < numNonLambdaSymbols; i++) {
						// const obj =
						parseStack.pop();

						// console.log(`Reduce: Popped ${obj} off of the parseStack.`);
					}

					// console.log(`Reduce: Done popping; parseStack.peek() is ${parseStack.peek()}`);

					parseStack.push(this.go_to(parseStack.peek(), unstrippedProduction.lhs));

					if (parse && unstrippedProduction.rhs.length > 0) {
						// Grammar requirement: Every semantic action string appears at the end of a production.
						const semanticAction =
							unstrippedProduction.rhs[unstrippedProduction.rhs.length - 1]; // as string;

						if (typeof semanticAction === 'string') {
							this.grammar.executeSemanticAction(semanticStack, semanticAction);
						}
					}

					break;

				case ShiftReduceAction.Error:
					console.error(`Error: S from parseStack.peek() is ${typeof S} ${S}`, S);
					console.error(
						`Error: tokenAsSymbol is ${tokenAsSymbol} ${GrammarSymbol[tokenAsSymbol]}`
					);
					console.error('semanticStack.size is', semanticStack.size);

					throw new SyntaxException('LR0Parser.shift_reduce_driver() : action === Error');

				default:
					// console.log(
					// 	`default: tokenAsSymbol is ${tokenAsSymbol} ${Symbol[tokenAsSymbol]}`
					// );
					throw new SyntaxException(
						`LR0Parser.shift_reduce_driver() : Syntax error at symbol ${GrammarSymbol[tokenAsSymbol]} value ${token.tokenValue}, line ${token.line}, column ${token.column}.`
					);
			}
		}

		throw new InternalErrorException(
			'LR0Parser.shift_reduce_driver() : The parse stack is empty, but the Accept state has not been reached.'
		);
	}

	public recognize(tokenList: IToken[]): void {
		// Throws an exception if an error is encountered.
		this.shift_reduce_driver(tokenList, false);
	}

	public parse(tokenList: IToken[]): unknown {
		return this.shift_reduce_driver(tokenList, true);
	}
}
