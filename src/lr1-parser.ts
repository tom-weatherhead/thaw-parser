// tom-weatherhead/thaw-parser/src/lr1-parser.ts

import { createSet, IImmutableSet, Stack } from 'thaw-common-utilities.ts';

import { GrammarSymbol, IGrammar, IProduction, IToken } from 'thaw-interpreter-types';

// import { Token } from 'thaw-lexical-analyzer';

import { GrammarException } from 'thaw-grammar';

import { LR0Configuration } from './lr0-parser';

import { ParserBase } from './parser-base';

import { ShiftReduceAction } from './shift-reduce-actions';

import { InternalErrorException } from './exceptions/internal-error';
import { ReduceReduceConflictException } from './exceptions/reduce-reduce-conflict';
import { ShiftReduceConflictException } from './exceptions/shift-reduce-conflict';
// import { ParserException } from './exceptions/parser';
import { SyntaxException } from './exceptions/syntax';

export class LR1Configuration extends LR0Configuration {
	public static fromLR0(src: LR0Configuration, look: GrammarSymbol): LR1Configuration {
		return new LR1Configuration(src.ProductionLHS, look, src.ProductionRHS);
	}

	public static fromProduction1(p: IProduction, look: GrammarSymbol): LR1Configuration {
		return new LR1Configuration(p.lhs, look, [
			GrammarSymbol.Dot,
			...p.getRHSWithNoSemanticActions()
		]);
	}

	public readonly Lookahead: GrammarSymbol;

	constructor(lhs: GrammarSymbol, look: GrammarSymbol, rhs: GrammarSymbol[] = []) {
		super(lhs, rhs);

		this.Lookahead = look;
	}

	public override equals(other: unknown): boolean {
		const otherConfig = other as LR1Configuration;

		// TODO: Try this:
		// if (otherConfig === this) {
		// 	return true;
		// }

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

	public override toString(): string {
		return `${super.toString()}; ${this.Lookahead}`;
	}

	// The "new" keyword is used here because this function hides a function in the base class which differs only by return type.

	public override AdvanceDot(): LR1Configuration {
		return LR1Configuration.fromLR0(super.AdvanceDot(), this.Lookahead);
	}
}

export class FSMState {
	// public readonly ConfigurationSet = new Set<LR1Configuration>();
	public readonly Transitions = new Map<GrammarSymbol, FSMState>();
	private readonly asString: string;

	constructor(public readonly ConfigurationSet: IImmutableSet<LR1Configuration>) {
		// this.ConfigurationSet = cs;

		const s = this.ConfigurationSet.toArray().map((c: LR1Configuration) => `${c}`);

		s.sort();

		this.asString = s.join(' ## ');
	}

	public equals(other: unknown): boolean {
		// TODO: Find a better implementation for this function.  Beware of cycles in the finite state machine (or ignore the transitions in this function).
		// Note: The LR(1) parser works with the current code.

		// if (object.ReferenceEquals(this, obj))
		// {
		//     return true;
		// }

		const that = other as FSMState;

		// TODO: Should we also consider Transitions.Keys?
		return typeof that !== 'undefined' && this.ConfigurationSet.equals(that.ConfigurationSet);
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
		return this.asString;
	}
}

export class FiniteStateMachine {
	public readonly StateList: FSMState[];
	public readonly StartState: FSMState;

	constructor(ss: FSMState) {
		this.StartState = ss;
		this.StateList = [ss];
	}

	public FindStateWithLabel(cs: IImmutableSet<LR1Configuration>): FSMState | undefined {
		// Returns undefined if no state has the given configuration set.
		return this.StateList.find((state) => cs.equals(state.ConfigurationSet));
	}
}

export class StateSymbolPair {
	constructor(public readonly state: FSMState, public readonly symbol: GrammarSymbol) {}

	public equals(other: unknown): boolean {
		const that = other as StateSymbolPair;

		return (
			typeof that !== 'undefined' &&
			this.state.equals(that.state) &&
			this.symbol === that.symbol
		);
	}

	public toString(): string {
		return `${this.state} ++ ${this.symbol}`;
	}
}

export class LR1Parser extends ParserBase {
	private readonly AllSymbols: IImmutableSet<GrammarSymbol>;
	public readonly machine: FiniteStateMachine;
	// private readonly GoToTable = new Map<StateSymbolPair, FSMState>();
	private readonly GoToTable: ReadonlyMap<string, FSMState>;

	constructor(g: IGrammar) {
		super(g);

		this.AllSymbols = createSet<GrammarSymbol>(g.terminals.concat(g.nonTerminals));
		this.machine = this.build_LR1();
		this.GoToTable = this.build_go_to_table();
	}

	// public LR1Parser(GrammarSelector gs)
	//     : this(GrammarFactory.Create(gs))
	// {
	// }

	public get NumberOfStates(): number {
		return this.machine.StateList.length;
	}

	// Adapted from Fischer and LeBlanc, page 156.

	private closure1(s: IImmutableSet<LR1Configuration>): IImmutableSet<LR1Configuration> {
		const sPrime = createSet<LR1Configuration>(s);
		const additions = createSet<LR1Configuration>();

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

				if (l !== GrammarSymbol.Lambda || rho.length === 0) {
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
							p.stripOutSemanticActions(),
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

	private go_to1(
		s: IImmutableSet<LR1Configuration>,
		X: GrammarSymbol
	): IImmutableSet<LR1Configuration> {
		const sb = createSet<LR1Configuration>();

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

	private compute_s0(): IImmutableSet<LR1Configuration> {
		const p = this.grammar.findStartingProduction();

		return this.closure1(
			createSet<LR1Configuration>([LR1Configuration.fromProduction1(p, GrammarSymbol.Lambda)])
		);
	}

	// Adapted from Fischer and LeBlanc, page 158.

	private build_LR1(): FiniteStateMachine {
		const s0 = this.compute_s0();
		const startState = new FSMState(s0);
		const fsm = new FiniteStateMachine(startState);
		const S = new Stack<IImmutableSet<LR1Configuration>>();

		S.push(s0);

		while (S.size > 0) {
			const s = S.pop();

			// Consider both terminals and non-terminals.

			for (const X of this.AllSymbols) {
				const g = this.go_to1(s, X);

				// if (g.Count == 0) {
				//     continue;
				// }

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
					throw new InternalErrorException(
						'LR1Parser.build_LR1() : Finite state machine transition is being overwritten.'
					);
				}

				stateS.Transitions.set(X, stateG);
			}
		}

		return fsm;
	}

	// Adapted from Fischer and LeBlanc, pages 158-159.

	private GetAction(
		S: FSMState,
		tokenAsSymbol: GrammarSymbol
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
				const productionToCompare = this.grammar.productions[i].stripOutSemanticActions();

				if (matchedProduction.equals(productionToCompare)) {
					if (reduceResultFound && reduceProductionNum != i) {
						throw new ReduceReduceConflictException(
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
		const shiftOrAcceptResultFound =
			typeof S.ConfigurationSet.toArray().find(
				(c: LR1Configuration) => c.FindSymbolAfterDot() === tokenAsSymbol
			) !== 'undefined';

		if (shiftOrAcceptResultFound) {
			if (reduceResultFound) {
				throw new ShiftReduceConflictException(
					'GetAction() : Multiple actions found; grammar is not LR(1).'
				);
			}

			result =
				tokenAsSymbol === GrammarSymbol.terminalEOF
					? ShiftReduceAction.Accept
					: ShiftReduceAction.Shift;
		}

		return {
			reduceProductionNum,
			action: result
		};
	}

	// Adapted from Fischer and LeBlanc, page 150.

	private build_go_to_table(): ReadonlyMap<string, FSMState> {
		// this.GoToTable.clear();
		const goToTable = new Map<string, FSMState>();

		for (const S of this.machine.StateList) {
			// for (const X of S.Transitions.keys()) {
			// 	// TODO: Try S.Transitions.entries()
			// 	const value = S.Transitions.get(X);
			//
			// 	if (typeof value !== 'undefined') {
			// 		goToTable.set(new StateSymbolPair(S, X).toString(), value);
			// 	}
			// }

			for (const [X, value] of S.Transitions.entries()) {
				goToTable.set(new StateSymbolPair(S, X).toString(), value);
			}
		}

		return goToTable;
	}

	private go_to(S: FSMState, tokenAsSymbol: GrammarSymbol): FSMState {
		const pair = new StateSymbolPair(S, tokenAsSymbol).toString();

		if (!this.GoToTable.has(pair)) {
			throw new InternalErrorException(`go_to() failed on token ${tokenAsSymbol}`);
		}

		const result = this.GoToTable.get(pair);

		if (typeof result === 'undefined') {
			throw new Error(`LR1 go_to() : Failed to find the pair '${pair}' in the GoToTable.`);
		}

		return result;
	}

	// Adapted from Fischer and LeBlanc, page 142.

	private shift_reduce_driver(tokenList: IToken[], parse: boolean): unknown {
		if (tokenList.length === 0) {
			throw new SyntaxException('Token list is empty');
		}

		let tokenNum = 0;
		let token = tokenList[tokenNum];
		let tokenAsSymbol = this.grammar.tokenToSymbol(token);
		const parseStack = new Stack<FSMState>(); // The parse stack, which contains machine states.
		const semanticStack = new Stack<unknown>();

		parseStack.push(this.machine.StartState);

		while (parseStack.size > 0) {
			const S = parseStack.peek();
			const { reduceProductionNum, action } = this.GetAction(S, tokenAsSymbol);
			const semanticStackSize = semanticStack.size;
			let SPrime: FSMState;
			let unstrippedProduction: IProduction;

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
							token
						);
					}

					// Get next token.
					++tokenNum;

					if (tokenNum >= tokenList.length) {
						throw new SyntaxException('Unexpected end of token list');
					}

					token = tokenList[tokenNum];
					tokenAsSymbol = this.grammar.tokenToSymbol(token);

					break;

				case ShiftReduceAction.Reduce:
					if (
						reduceProductionNum < 0 ||
						reduceProductionNum >= this.grammar.productions.length
					) {
						throw new InternalErrorException('Reduce: Invalid production number');
					}

					unstrippedProduction = this.grammar.productions[reduceProductionNum];

					// Production p = unstrippedProduction.StripOutSemanticActions();
					//
					// for (int i = 0; i < p.rhs.Count; ++i) {
					//
					//     if (!p.rhs[i].Equals(Symbol.Lambda)) {    // Test; hack.
					//         parseStack.Pop();
					//     }
					// }

					// Pop the production's non-Lambda symbols off of the parse stack.
					unstrippedProduction
						.getRHSWithNoSemanticActions()
						.filter((symbol: GrammarSymbol) => symbol !== GrammarSymbol.Lambda)
						.forEach(() => parseStack.pop());

					SPrime = parseStack.peek();

					parseStack.push(this.go_to(SPrime, unstrippedProduction.lhs));

					if (parse && unstrippedProduction.rhs.length > 0) {
						// Grammar requirement: Every semantic action string appears at the end of a production.
						const semanticAction = unstrippedProduction.rhs[
							unstrippedProduction.rhs.length - 1
						] as string;

						// if (typeof semanticAction !== 'undefined') {
						if (typeof semanticAction === 'string') {
							this.grammar.executeSemanticAction(semanticStack, semanticAction);
						}
					}

					break;

				default:
					// I.e. Error
					throw new SyntaxException(
						`LR1Parser.shift_reduce_driver() : Syntax error at symbol ${tokenAsSymbol}`,
						token.line,
						token.column
					);
			}
		}

		throw new InternalErrorException(
			'LR1Parser.shift_reduce_driver() : The parse stack is empty, but the Accept state has not been reached.'
		);
	}

	public override recognize(tokenList: IToken[]): void {
		// Throws an exception if an error is encountered.
		this.shift_reduce_driver(tokenList, false);
	}

	public override parse(tokenList: IToken[]): unknown {
		return this.shift_reduce_driver(tokenList, true);
	}
}
