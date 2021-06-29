// thaw-parser/test/parser/slr1.test.ts

// Grammar 3 (from Fischer and LeBlanc page 158)
// Grammar 3 is both LR(1) and SLR(1) (see page 165)
// S -> E $
// E -> E + T | T
// T -> T * P | P
// P -> ID | ( E )

// Grammar 4 (from Fischer and LeBlanc page 165)
// Grammar 3 is LR(1) but not SLR(1)
// Elem -> ( List , Elem )
// Elem -> Scalar
// List -> List , Elem
// List -> Elem
// Scalar -> ID
// Scalar -> ( Scalar )

'use strict';

import { Stack } from 'thaw-common-utilities.ts';

import {
	createTokenizer,
	LexicalAnalyzerSelector,
	LexicalState,
	Token
} from 'thaw-lexical-analyzer';

import {
	createGrammar,
	GrammarBase,
	GrammarException,
	LanguageSelector,
	Production,
	Symbol
} from 'thaw-grammar';

import { createParser, ParserSelector } from '../..';

/* eslint-disable @typescript-eslint/ban-types */

class Grammar3 extends GrammarBase {
	constructor() {
		super(Symbol.nonterminalStart);

		// Terminals:
		this.terminals.push(Symbol.terminalLeftBracket);
		this.terminals.push(Symbol.terminalRightBracket);
		this.terminals.push(Symbol.terminalID);
		this.terminals.push(Symbol.terminalPlus);
		this.terminals.push(Symbol.terminalMultiply);
		this.terminals.push(Symbol.terminalEOF);

		this.nonTerminals.push(Symbol.nonterminalStart);
		this.nonTerminals.push(Symbol.nonterminalExpression);
		this.nonTerminals.push(Symbol.nonterminalTerm);
		this.nonTerminals.push(Symbol.nonterminalPrimary);

		// this.productions.push(
		// 	new Production(
		// 		Symbol.nonterminalExpression,
		// 		[Symbol.nonterminalPrimary],
		// 		3
		// 	)
		// );
		// this.productions.push(
		// 	new Production(
		// 		Symbol.nonterminalPrimary,
		// 		[Symbol.terminalID],
		// 		2
		// 	)
		// );

		// See Fischer and LeBlanc, page 158
		this.productions.push(
			new Production(
				Symbol.nonterminalStart,
				[Symbol.nonterminalExpression, Symbol.terminalEOF],
				1
			)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalExpression,
				[
					Symbol.nonterminalExpression,
					Symbol.terminalPlus,
					Symbol.nonterminalTerm
				],
				2
			)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalExpression,
				[Symbol.nonterminalTerm],
				3
			)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalTerm,
				[
					Symbol.nonterminalTerm,
					Symbol.terminalMultiply,
					Symbol.nonterminalPrimary
				],
				4
			)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalTerm,
				[Symbol.nonterminalPrimary],
				5
			)
		);
		this.productions.push(
			new Production(Symbol.nonterminalPrimary, [Symbol.terminalID], 6)
		);
		this.productions.push(
			new Production(
				Symbol.nonterminalPrimary,
				[
					Symbol.terminalLeftBracket,
					Symbol.nonterminalExpression,
					Symbol.terminalRightBracket
				],
				7
			)
		);
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */

	public executeSemanticAction(
		semanticStack: Stack<any>,
		action: string
	): void {
		throw new Error('Grammar3.ExecuteSemanticAction()'); // NotImplementedException
	}

	public tokenToSymbol(token: Token): Symbol {
		switch (token.tokenType) {
			case LexicalState.tokenLeftBracket:
				return Symbol.terminalLeftBracket;
			case LexicalState.tokenRightBracket:
				return Symbol.terminalRightBracket;
			case LexicalState.tokenIdent:
				return Symbol.terminalID;
			case LexicalState.tokenPlus:
				return Symbol.terminalPlus;
			case LexicalState.tokenMult:
				return Symbol.terminalMultiply;
			case LexicalState.tokenEOF:
				return Symbol.terminalEOF;

			default:
				throw new GrammarException(
					`Grammar3: No grammar symbol matches token ${
						token.tokenType
					} ${LexicalState[token.tokenType]} (value '${
						token.tokenValue
					}')`,
					token.line,
					token.column
				);
		}
	}

	public pushTokenOntoSemanticStack(
		semanticStack: Stack<object>,
		tokenAsSymbol: Symbol,
		token: Token
	): void {
		throw new Error('Grammar3.PushTokenOntoSemanticStack()'); // NotImplementedException
	}

	/* eslint-enable @typescript-eslint/no-unused-vars */
}

function makeGrammar3Recognizer(): (input: string) => void {
	const ls = LanguageSelector.Scheme;
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const grammar = new Grammar3();
	const parser = createParser(ParserSelector.SLR1, grammar);

	return (input: string) => {
		parser.recognize(tokenizer.tokenize(input));
	};
}

function makeSchemeRecognizer(): (input: string) => void {
	// const ls = LanguageSelector.Inference;
	const ls = LanguageSelector.Scheme;
	// const schemeGlobalInfo = new SchemeGlobalInfo();
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const grammar = createGrammar(ls);
	const parser = createParser(ParserSelector.SLR1, grammar);

	return (input: string) => {
		parser.recognize(tokenizer.tokenize(input));
	};
}

test('SLR(1) Grammar3 recognize test 1', () => {
	const f = makeGrammar3Recognizer();

	f('a');
	f('a + b');
	f('a * b');
	f('(a + b) * c');
});

test('SLR(1) Scheme recognize test 1', () => {
	const f = makeSchemeRecognizer();

	// f('');
	// f('@isMan(?x) -> @isMortal(?x)');

	// f('pred1.');
	// f('?- pred1.');

	// f('soln(13).');
	// f('?- soln(X).');

	f('(+ 2 3)');
});

// class SLR1Parser_Fixture {
//     private readonly ITokenizer tokenizer;
//     private readonly IParser parser;

//     public SLR1Parser_Fixture()
//     {
//         tokenizer = TokenizerFactory.Create(GrammarSelector.Inference);
//         parser = ParserFactory.Create(ParserSelector.SLR1, GrammarSelector.Inference);
//     }

//     [Test]
//     public void RecognizeManIsMortalTest()
//     {
//         parser.Recognize(tokenizer.Tokenize("@isMan(?x) -> @isMortal(?x)"));
//     }

//     [Test]
//     public void MicroRecognizeTest1()
//     {
//         IParser parserMicro = ParserFactory.Create(ParserSelector.SLR1, GrammarSelector.Micro);

//         parserMicro.Recognize(tokenizer.Tokenize("begin abc := def + 123; i := i - 1; end"));
//     }

//     [Test]
//     public void ParseManIsMortalTest()
//     {
//         string strInput = "!@isMan(?x) || @isMortal(?x)";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         //Assert.AreEqual(expected, actual);
//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseSocratesIsAManTest()
//     {
//         string strInput = "@isMan(Socrates)";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseFatherFunctionTest()
//     {
//         string strInput = "@isFatherOf(father(?x), ?x)";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseSkolemFunctionTest1()
//     {
//         string strInput = "@isFoo($S1())";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseSkolemFunctionTest2()
//     {
//         string strInput = "@isFatherOf($father(?x), ?x)";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseIntLitTest()
//     {
//         string strInput = "@isIntLit(123)";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseStrLitTest()
//     {
//         string strInput = "@isStrLit(\"abc\")";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseTransitivityTest1()
//     {
//         string strInput = "!@equals(?a, ?b) || !@equals(?b, ?c) || @equals(?a, ?c)";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseTransitivityTest2()
//     {
//         string strInput = "(@equals(?a, ?b) && @equals(?b, ?c)) -> @equals(?a, ?c)";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();
//         string strExpectedOutput = "!(@equals(?a, ?b) && @equals(?b, ?c)) || @equals(?a, ?c)";

//         Assert.AreEqual(strExpectedOutput, strOutput);
//     }

//     [Test]
//     public void ParseTransitivityTest3()
//     {
//         string strInput = "(@equals(?a, ?b) && @equals(?b, ?c)) -> @equals(?a, ?c)";
//         IBooleanExpression boolExpr = parser.Parse(tokenizer.Tokenize(strInput)) as IBooleanExpression;

//         Assert.IsNotNull(boolExpr);

//         List<Clause> listOfClauses = Clause.ConvertBooleanExpressionToClausalForm(boolExpr);

//         Assert.AreEqual(1, listOfClauses.Count);

//         string strOutput = listOfClauses[0].ToString();
//         string strExpectedOutput = "!@equals(?a, ?b) || !@equals(?b, ?c) || @equals(?a, ?c)";

//         Assert.AreEqual(strExpectedOutput, strOutput);
//     }

//     [Test]
//     public void ParseJunctionTest1()
//     {
//         string strInput = "@a() || (@b() && @c())";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseJunctionTest2()
//     {
//         string strInput = "@a() && (@b() || @c())";
//         object output = parser.Parse(tokenizer.Tokenize(strInput));
//         string strOutput = output.ToString();

//         Assert.AreEqual(strInput, strOutput);
//     }

//     [Test]
//     public void ParseErrorTest1()
//     {
//         Assert.Throws<SyntaxException>(() => parser.Parse(tokenizer.Tokenize("@f(?x")));
//     }

//     [Test]
//     public void ParseErrorTest2()
//     {
//         Assert.Throws<SyntaxException>(() => parser.Parse(tokenizer.Tokenize("@f(?x))")));
//     }

//     [Test]
//     public void ParseErrorTest3()
//     {
//         Assert.Throws<SyntaxException>(() => parser.Parse(tokenizer.Tokenize("@f(?x) @g(?y)")));
//     }

// #if DEAD_CODE
//     [Test]
//     public void BrokenPrologGrammarTest()
//     {
//         var t = TokenizerFactory.Create(GrammarSelector.Prolog2);
//         var p = new SLR1Parser(new BrokenPrologGrammar());

//         Assert.Throws<ReduceReduceConflictException>(() => p.Recognize(t.Tokenize("?- mia(X) = mia(t).")));
//     }

//     [Test]
//     public void FixedPrologGrammarTest()
//     {
//         var t = TokenizerFactory.Create(GrammarSelector.Prolog2);
//         var p = new SLR1Parser(new FixedPrologGrammar());

//         //Assert.Throws<ReduceReduceConflictException>(() => p.Recognize(t.Tokenize("?- mia(X) = mia(t).")));
//         p.Recognize(t.Tokenize("?- mia(X) = mia(t)."));
// #if DEAD_CODE
//         p.Recognize(t.Tokenize("number(1).")); // This causes a shift-reduce conflict.
//         p.Recognize(t.Tokenize("Number(1)."));
//         p.Recognize(t.Tokenize("foo(X) :- bar(X)."));
//         p.Recognize(t.Tokenize("foo(X) :- Bar(X)."));
//         p.Recognize(t.Tokenize("Foo(X) :- bar(X)."));
//         p.Recognize(t.Tokenize("Foo(X) :- Bar(X)."));
//         p.Recognize(t.Tokenize("?- number(X), print(X)."));
//         //p.Recognize(t.Tokenize("."));
// #endif
//     }
// #endif
// }
