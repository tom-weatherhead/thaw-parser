// tom-weatherhead/thaw-parser/src/ll1-parser.ts

import {
	arrayIncludes, // Handy for arrays of basic types, e.g. number[]
	IImmutableSet,
	Stack
} from 'thaw-common-utilities.ts';

import {
	GrammarSymbol,
	IGrammar,
	ParserSelector,
	IProduction,
	IToken
} from 'thaw-interpreter-types';

// import { ArgumentException } from 'thaw-grammar';

import { ParserException } from './exceptions/parser';
import { SyntaxException } from './exceptions/syntax';

import { ParserBase } from './parser-base';

export class LL1Parser extends ParserBase {
	private readonly predict: ReadonlyMap<IProduction, IImmutableSet<GrammarSymbol>>; // TODO: Convert the key type to string?
	private readonly parseTable: ReadonlyMap<string, IProduction>;

	constructor(g: IGrammar) {
		super(g);

		// error TS2339: Property 'includes' does not exist on type 'number[]'.
		if (!arrayIncludes(g.selectorsOfCompatibleParsers, ParserSelector.LL1)) {
			throw new ParserException(
				`LL1Parser constructor: Error: The provided grammar for ${g.languageName} cannot be parsed by an LL(1) parser` // ,
				// 'g'
			);
		}

		this.predict = this.fillPredict();
		this.parseTable = this.fillParseTable();
	}

	private fillPredict(): ReadonlyMap<IProduction, IImmutableSet<GrammarSymbol>> {
		const predict = new Map<IProduction, IImmutableSet<GrammarSymbol>>();

		for (const p of this.grammar.productions) {
			let s = this.computeFirst(p.getRHSWithNoSemanticActions());

			if (s.contains(GrammarSymbol.Lambda)) {
				s = this.withoutLambda(s);

				const followSet = this.followSet.get(p.lhs);

				if (typeof followSet === 'undefined') {
					throw new ParserException('fillPredict() : followSet is undefined');
				}

				s.unionInPlace(followSet);
			}

			predict.set(p, s);
		}

		return predict;
	}

	private fillParseTable(): ReadonlyMap<string, IProduction> {
		const parseTable = new Map<string, IProduction>();

		for (const p of this.grammar.productions) {
			const pValue = this.predict.get(p);

			if (typeof pValue === 'undefined') {
				throw new ParserException('LL1Parser.fillParseTable() : pValue is undefined');
			}

			for (const t of pValue) {
				// const sp = new SymbolPair(p.lhs, t);
				const sp = `(${p.lhs}, ${t})`;
				const pParseTableSPRaw = parseTable.get(sp);

				if (typeof pParseTableSPRaw !== 'undefined') {
					throw new ParserException(
						`Error in FillParseTable() : Table entry not unique; p.lhs = ${p.lhs} ${
							GrammarSymbol[p.lhs]
						}; t = ${t} ${GrammarSymbol[t]}; p1 = ${pParseTableSPRaw}; p2 = ${p}`
					);
				}

				parseTable.set(sp, p);
			}
		}

		return parseTable;
	}

	// Adapted from Fischer and LeBlanc, page 121 (function lldriver())

	private llDriver(tokenList: IToken[], parse: boolean): unknown {
		if (tokenList.length === 0) {
			throw new ParserException('Token list is empty');
		}

		let tokenNum = 0;
		let token = tokenList[tokenNum];
		let tokenAsSymbol = this.grammar.tokenToSymbol(token);
		const parseStack = new Stack<GrammarSymbol | string>();
		// The semanticStack contains items of type e.g. IExpression<ISExpression>
		const semanticStack = new Stack<unknown>();

		parseStack.push(this.grammar.startSymbol);

		while (!parseStack.isEmpty()) {
			const X = parseStack.peek();

			if (typeof X === 'string') {
				if (parse) {
					const action = X as string;

					this.grammar.executeSemanticAction(semanticStack, action);
				}

				parseStack.pop();
			} else if (typeof X === 'number') {
				const symbolX = X as GrammarSymbol;
				// const sp = new SymbolPair(symbolX, tokenAsSymbol);
				const sp = `(${symbolX}, ${tokenAsSymbol})`;
				const parseTableGetSP = this.parseTable.get(sp) as IProduction;

				if (
					this.grammar.nonTerminals.indexOf(symbolX) >= 0 &&
					typeof parseTableGetSP !== 'undefined'
				) {
					const p = parseTableGetSP;

					// console.log(`Using production ${p.lhs} => ${p.rhs}`);
					parseStack.pop();

					for (let i = p.rhs.length - 1; i >= 0; --i) {
						if ((p.rhs[i] as GrammarSymbol) !== GrammarSymbol.Lambda) {
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
						`Failed to match symbol ${X} ${
							GrammarSymbol[X]
						} (type ${typeof X}) to symbol ${
							GrammarSymbol[tokenAsSymbol]
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

	public recognize(tokenList: IToken[]): void {
		// Throws an exception if an error is encountered.
		this.llDriver(tokenList, false);
	}

	public parse(tokenList: IToken[]): unknown {
		return this.llDriver(tokenList, true);
	}
}
