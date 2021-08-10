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
		if (!arrayIncludes(g.selectorsOfCompatibleParsers, ParserSelector.LL1)) {
			throw new ArgumentException(
				`LL1Parser constructor: Error: The provided grammar for ${g.languageName} cannot be parsed by an LL(1) parser`,
				'g'
			);
		}

		this.fillPredict();
		this.fillParseTable();
	}

	private fillPredict(): void {
		for (const p of this.grammar.productions) {
			let s = this.computeFirst(p.RHSWithNoSemanticActions());

			if (s.contains(Symbol.Lambda)) {
				s = this.withoutLambda(s);
				s.unionInPlace(this.followSet.get(p.lhs) as Set<number>);
			}

			this.predict.set(p, s);
		}
	}

	private fillParseTable(): void {
		for (const p of this.grammar.productions) {
			const pValue = this.predict.get(p);

			if (typeof pValue === 'undefined') {
				throw new Error('LL1Parser.fillParseTable() : pValue is undefined');
			}

			for (const t of pValue) {
				// const sp = new SymbolPair(p.lhs, t);
				const sp = `(${p.lhs}, ${t})`;
				const pParseTableSPRaw = this.parseTable.get(sp) as Production;

				if (typeof pParseTableSPRaw !== 'undefined') {
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
			const X = parseStack.peek();
			// const X = parseStack.pop();
			// parseStack.push(X);

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

				if (
					this.grammar.nonTerminals.indexOf(symbolX) >= 0 &&
					typeof parseTableGetSP !== 'undefined'
				) {
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
				throw new ParserException(
					`Unrecognized parse stack entry '${X}' of type ${typeof X}`
				);
			}
		}

		if (!parse) {
			return undefined;
		}

		if (semanticStack.isEmpty()) {
			throw new ParserException(
				'There were no objects on the semantic stack; expected exactly one'
			);
		}

		const result = semanticStack.pop();

		if (!semanticStack.isEmpty()) {
			throw new ParserException(
				'There was more than one object on the semantic stack; expected exactly one'
			);
		}

		return result;
	}

	public recognize(tokenList: Token[]): void {
		// Throws an exception if an error is encountered.
		this.llDriver(tokenList, false);
	}

	public parse(tokenList: Token[]): unknown {
		return this.llDriver(tokenList, true);
	}
}
