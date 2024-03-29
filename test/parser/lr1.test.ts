// thaw-parser/test/parser/lr1.test.ts

'use strict';

// import { LanguageSelector, LexicalAnalyzerSelector, ParserSelector } from 'thaw-interpreter-types';
//
// import { createTokenizer } from 'thaw-lexical-analyzer';
//
// import { createParser, SyntaxException } from '../..';

// // import { Grammar1 } from '../test-grammars/grammar1';

test('LR(1) bogus test', () => {
	expect(true).toBeTruthy();
});

// test('LR(1) parser instance creation test', () => {
// 	// Arrange
// 	// const ls = LanguageSelector.Scheme; // This works, but it takes about 30 seconds.
// 	const ls = LanguageSelector.Chapter1;
// 	const grammar = createGrammar(ls);
//
// 	// Act
// 	const parser = createParser(ParserSelector.LR1, grammar);
//
// 	// Assert
// 	expect(parser).toBeTruthy();
// });

// test('LR(1) recognize test', () => {
// 	// Arrange
// 	const ls = LanguageSelector.Chapter1;
// 	const grammar = createGrammar(ls);
// 	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	const parser = createParser(ParserSelector.LR1, grammar);
//
// 	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));
//
// 	f('(* 7 13)');
//
// 	expect(() => f('(* 7 13')).toThrow(SyntaxException);
// });

// function lr1ParserTest(data: Array<[input: string, expectedResult: string | string[]]>): void {
// 	// Arrange
// 	const ls = LanguageSelector.Chapter1;
// 	const globalInfo = new Chapter1GlobalInfo();
// 	const grammar = createGrammar(ls);
// 	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	const parser = createParser(ParserSelector.LR1, grammar);
//
// 	for (const [input, expectedResult] of data) {
// 		// Act
// 		const parseResult = parser.parse(tokenizer.tokenize(input));
// 		const expr = parseResult as IExpression<number>;
// 		const actualResult = expr.evaluate(globalInfo.globalEnvironment, globalInfo).toString();
//
// 		// console.log(`input: ${input}\nactualResult:\n${actualResult}\n\n`);
//
// 		// Assert
// 		if (typeof expectedResult === 'string') {
// 			expect(actualResult).toBe(expectedResult);
// 		} else {
// 			for (const str of expectedResult) {
// 				expect(actualResult.includes(str)).toBe(true);
// 			}
// 		}
// 	}
// }
//
// test('LR(1) Chapter1 addition test', () => {
// 	// Arrange
// 	lr1ParserTest([['(+ 2 3)', '5']]);
// });

// ****

// public LR1Parser_Fixture()
// {
//     tokenizer = TokenizerFactory.Create(GrammarSelector.Inference);
//     parser = ParserFactory.Create(ParserSelector.LR1, GrammarSelector.Inference);
// }
//
// [Test]
// public void RecognizeManIsMortalTest()
// {
//     parser.Recognize(tokenizer.Tokenize("@isMan(?x) -> @isMortal(?x)"));
// }
//
// [Test]
// public void MicroRecognizeTest1()
// {
//     IParser parserMicro = ParserFactory.Create(ParserSelector.LR1, GrammarSelector.Micro);
//
//     parserMicro.Recognize(tokenizer.Tokenize("begin abc := def + 123; i := i - 1; end"));
// }
//
// [Test]
// public void ParseManIsMortalTest()
// {
//     string strInput = "!@isMan(?x) || @isMortal(?x)";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     //Assert.AreEqual(expected, actual);
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseSocratesIsAManTest()
// {
//     string strInput = "@isMan(Socrates)";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseFatherFunctionTest()
// {
//     string strInput = "@isFatherOf(father(?x), ?x)";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseSkolemFunctionTest1()
// {
//     string strInput = "@isFoo($S1())";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseSkolemFunctionTest2()
// {
//     string strInput = "@isFatherOf($father(?x), ?x)";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseIntLitTest()
// {
//     string strInput = "@isIntLit(123)";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseStrLitTest()
// {
//     string strInput = "@isStrLit(\"abc\")";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseTransitivityTest1()
// {
//     string strInput = "!@equals(?a, ?b) || !@equals(?b, ?c) || @equals(?a, ?c)";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseTransitivityTest2()
// {
//     string strInput = "(@equals(?a, ?b) && @equals(?b, ?c)) -> @equals(?a, ?c)";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//     string strExpectedOutput = "!(@equals(?a, ?b) && @equals(?b, ?c)) || @equals(?a, ?c)";
//
//     Assert.AreEqual(strExpectedOutput, strOutput);
// }
//
// [Test]
// public void ParseTransitivityTest3()
// {
//     string strInput = "(@equals(?a, ?b) && @equals(?b, ?c)) -> @equals(?a, ?c)";
//     IBooleanExpression boolExpr = parser.Parse(tokenizer.Tokenize(strInput)) as IBooleanExpression;
//
//     Assert.IsNotNull(boolExpr);
//
//     List<Clause> listOfClauses = Clause.ConvertBooleanExpressionToClausalForm(boolExpr);
//
//     Assert.AreEqual(1, listOfClauses.Count);
//
//     string strOutput = listOfClauses[0].ToString();
//     string strExpectedOutput = "!@equals(?a, ?b) || !@equals(?b, ?c) || @equals(?a, ?c)";
//
//     Assert.AreEqual(strExpectedOutput, strOutput);
// }
//
// [Test]
// public void ParseJunctionTest1()
// {
//     string strInput = "@a() || (@b() && @c())";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseJunctionTest2()
// {
//     string strInput = "@a() && (@b() || @c())";
//     object output = parser.Parse(tokenizer.Tokenize(strInput));
//     string strOutput = output.ToString();
//
//     Assert.AreEqual(strInput, strOutput);
// }
//
// [Test]
// public void ParseErrorTest1()
// {
//     Assert.Throws<SyntaxException>(() => parser.Parse(tokenizer.Tokenize("@f(?x")));
// }
//
// [Test]
// public void ParseErrorTest2()
// {
//     Assert.Throws<SyntaxException>(() => parser.Parse(tokenizer.Tokenize("@f(?x))")));
// }
//
// [Test]
// public void ParseErrorTest3()
// {
//     Assert.Throws<SyntaxException>(() => parser.Parse(tokenizer.Tokenize("@f(?x) @g(?y)")));
// }
