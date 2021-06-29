// thaw-parser/test/parser/slr1.test.ts

'use strict';

// import { Stack } from 'thaw-common-utilities.ts';

import {
	createTokenizer,
	LexicalAnalyzerSelector // ,
	// LexicalState,
	// Token
} from 'thaw-lexical-analyzer';

import {
	createGrammar,
	// GrammarBase,
	// GrammarException,
	LanguageSelector // ,
	// Production,
	// Symbol
} from 'thaw-grammar';

import { createParser, ParserSelector } from '../..';

function makeRecognizer(): (input: string) => void {
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

/* eslint-disable @typescript-eslint/ban-types */

test('SLR(1) Scheme recognize test 1', () => {
	const f = makeRecognizer();

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
