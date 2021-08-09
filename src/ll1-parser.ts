// tom-weatherhead/thaw-parser/src/ll1-parser.ts

import {
	arrayIncludes, // Handy for arrays of basic types, e.g. number[]
	Set,
	Stack
} from 'thaw-common-utilities.ts';

import { Token } from 'thaw-lexical-analyzer';

import { ArgumentException, IGrammar, ParserSelector, Production, Symbol } from 'thaw-grammar';

import { ParserException } from './exceptions/parser';
import { SyntaxException } from './exceptions/syntax';

import { ParserBase } from './parser-base';

export class LL1Parser extends ParserBase {
	private readonly predict = new Map<Production, Set<number>>(); // TODO: Convert the key type to string?
	private readonly parseTable = new Map<string, Production>();

	constructor(g: IGrammar) {
		super(g);

		// error TS2339: Property 'includes' does not exist on type 'number[]'.
		// if(!g.selectorsOfCompatibleParsers.includes(ParserSelector.LL1)) {
		// if (g.selectorsOfCompatibleParsers.indexOf(ParserSelector.LL1) < 0) {
		if (!arrayIncludes(g.selectorsOfCompatibleParsers, ParserSelector.LL1)) {
			throw new ArgumentException(
				`LL1Parser constructor: Error: The provided grammar for ${g.languageName} cannot be parsed by an LL(1) parser`,
				'g'
			);
		}

		this.fillPredict();
		this.fillParseTable();
	}

	public recognize(tokenList: Token[]): void {
		// Throws an exception if an error is encountered.
		this.llDriver(tokenList, false);
	}

	public parse(tokenList: Token[]): unknown {
		return this.llDriver(tokenList, true);
	}

	private fillPredict(): void {
		// this.grammar.productions.for Each((p: Production) => {
		for (const p of this.grammar.productions) {
			let s = this.computeFirst(p.RHSWithNoSemanticActions());

			if (s.contains(Symbol.Lambda)) {
				s = this.withoutLambda(s);
				s.unionInPlace(this.followSet.get(p.lhs) as Set<number>);
			}

			this.predict.set(p, s);
		} // );
	}

	private fillParseTable(): void {
		// this.grammar.productions.for Each((p: Production) => {
		for (const p of this.grammar.productions) {
			// const predictIterator = (
			// 	this.predict.get(p) as Set<number>
			// ).getIterator();
			const pValue = this.predict.get(p);

			if (typeof pValue === 'undefined') {
				throw new Error('LL1Parser.fillParseTable() : pValue is undefined');
			}

			// while (!predictIterator.isDone()) {
			// 	const t = predictIterator.next() as number;
			for (const t of pValue) {
				// const sp = new SymbolPair(p.lhs, t);
				const sp = `(${p.lhs}, ${t})`;
				const pParseTableSPRaw = this.parseTable.get(sp) as Production;

				if (pParseTableSPRaw !== undefined) {
					throw new ParserException(
						`Error in FillParseTable() : Table entry not unique; p.lhs = ${p.lhs} ${
							Symbol[p.lhs]
						}; t = ${t} ${
							Symbol[t]
						}; p1 = ${pParseTableSPRaw.toString()}; p2 = ${p.toString()}`
					);
				}

				// console.log(`Adding to parseTable: Key: (${p.lhs}, ${t}); value: ${p.lhs} => ${p.rhs}`);
				// console.log(`Adding to parseTable: Key: ${sp}; value: ${p.lhs} => ${p.rhs}`);
				this.parseTable.set(sp, p);
			}
		} // );
	}

	// Adapted from Fischer and LeBlanc, page 121 (function lldriver())

	private llDriver(tokenList: Token[], parse: boolean): unknown {
		if (tokenList.length === 0) {
			throw new ParserException('Token list is empty');
		}

		let tokenNum = 0;
		let token = tokenList[tokenNum];
		let tokenAsSymbol = this.grammar.tokenToSymbol(token);
		const parseStack = new Stack<unknown>(); // The parse stack
		const semanticStack = new Stack<unknown>();

		parseStack.push(this.grammar.startSymbol);

		while (!parseStack.isEmpty()) {
			// const X = parseStack.peek();
			const X = parseStack.pop();
			parseStack.push(X);

			if (typeof X === 'string') {
				if (parse) {
					const action = X as string;

					this.grammar.executeSemanticAction(semanticStack, action);
				}

				parseStack.pop();
			} else if (typeof X === 'number') {
				const symbolX = X as number;
				// const sp = new SymbolPair(symbolX, tokenAsSymbol);
				const sp = `(${symbolX}, ${tokenAsSymbol})`;
				const parseTableGetSP = this.parseTable.get(sp) as Production;

				// console.log(`tokenAsSymbol is ${tokenAsSymbol}`);
				// console.log(`symbolX is ${symbolX}`);
				// console.log(`indexOf symbolX in nonTerminals: ${this.grammar.nonTerminals.indexOf(symbolX)}`);
				// console.log(`this.parseTable.get(sp) is ${parseTableGetSP}`);

				// if (!parseTableGetSP) {
				// 	const firstSetForX = this.firstSet.get(symbolX);

				// 	console.log(`this.firstSet.get(symbolX) is ${firstSetForX} (type ${typeof firstSetForX})`);

				// 	if (firstSetForX instanceof Set) {
				// 		console.log(`firstSetForX contains tokenAsSymbol ${tokenAsSymbol} ? ${firstSetForX.contains(tokenAsSymbol) ? 'Yes' : 'No'}`);
				// 	}
				// }

				// if (this.grammar.nonTerminals.contains(symbolX) && this.parseTable.ContainsKey(sp)) {
				if (
					this.grammar.nonTerminals.indexOf(symbolX) >= 0 &&
					parseTableGetSP !== undefined
				) {
					// const p = this.parseTable[sp];
					const p = parseTableGetSP;

					// console.log(`Using production ${p.lhs} => ${p.rhs}`);
					parseStack.pop();

					for (let i = p.rhs.length - 1; i >= 0; --i) {
						if ((p.rhs[i] as number) !== Symbol.Lambda) {
							// Push semantic actions, and any symbols except Lambda.
							parseStack.push(p.rhs[i]);
						}
					}
				} else if (symbolX === tokenAsSymbol) {
					// console.log(`Matched token/symbol ${X}`);

					if (parse) {
						this.grammar.pushTokenOntoSemanticStack(
							semanticStack,
							tokenAsSymbol,
							token
						);
					}

					parseStack.pop();

					if (!parseStack.isEmpty()) {
						++tokenNum;

						if (tokenNum >= tokenList.length) {
							throw new ParserException(
								'End of token list; parse stack is not empty'
							);
						}

						token = tokenList[tokenNum];
						tokenAsSymbol = this.grammar.tokenToSymbol(token);
					}
				} else {
					throw new SyntaxException(
						`Failed to match symbol ${X} ${Symbol[X]} (type ${typeof X}) to symbol ${
							Symbol[tokenAsSymbol]
						} (${tokenAsSymbol}) (token ${tokenList[tokenNum].tokenType}) value ${
							tokenList[tokenNum].tokenValue
						}`,
						token.line,
						token.column
					);
				}
			} else {
				// throw new ParserException("Unrecognized parse stack entry of type " + ((X != null) ? X.GetType().FullName : "null"));
				throw new ParserException(
					`Unrecognized parse stack entry '${X}' of type ${typeof X}`
				);
			}
		}

		if (!parse) {
			return null;
		}

		if (semanticStack.isEmpty()) {
			throw new ParserException(
				'There were no objects on the semantic stack; expected exactly one'
			);
		}

		const result = semanticStack.pop();
		// const semanticStackSize = semanticStack.getSize();

		// if (semanticStackSize !== 1) {
		if (!semanticStack.isEmpty()) {
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
			throw new ParserException(
				'There was more than one object on the semantic stack; expected exactly one'
			);
		}

		return result;
	}
}
