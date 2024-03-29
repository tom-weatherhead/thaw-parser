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

import { LanguageSelector, LexicalAnalyzerSelector, ParserSelector } from 'thaw-interpreter-types';

import { createTokenizer } from 'thaw-lexical-analyzer';

// import { createGrammar } from 'thaw-grammar';

import { createParser } from '../..';

import { Grammar3 } from '../test-grammars/grammar3';

function makeGrammar3Recognizer(): (input: string) => void {
	const ls = LanguageSelector.Scheme;
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const grammar = new Grammar3();
	const parser = createParser(ParserSelector.SLR1, grammar);

	return (input: string) => {
		parser.recognize(tokenizer.tokenize(input));
	};
}

// function makeSchemeRecognizer(): (input: string) => void {
// 	// const ls = LanguageSelector.Inference;
// 	const ls = LanguageSelector.Scheme;
// 	// const schemeGlobalInfo = new SchemeGlobalInfo();
// 	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	const grammar = createGrammar(ls);
// 	const parser = createParser(ParserSelector.SLR1, grammar);
//
// 	return (input: string) => {
// 		parser.recognize(tokenizer.tokenize(input));
// 	};
// }

test('SLR(1) Grammar3 recognize test 1', () => {
	const f = makeGrammar3Recognizer();

	f('a');
	f('a + b');
	f('a * b');
	f('(a + b) * c');
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
//     }
