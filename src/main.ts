// tom-weatherhead/thaw-parser/src/main.ts

// Much of the code in this library was based on or inspired by the book
// 'Crafting a Compiler with C', by Charles N. Fischer and Richard J. LeBlanc, Jr., 1991,
// Benjamin/Cummings, ISBN 0-8053-2166-7.
//
// This was the textbook for the course CS 444 (Compiler Construction)
// at the University of Waterloo, Ontario, Canada, which I took in January-April 1994.

export { createParser } from './parser-factory';

export { InternalErrorException } from './exceptions/internal-error';
export { ReduceReduceConflictException } from './exceptions/reduce-reduce-conflict';
export { ShiftReduceConflictException } from './exceptions/shift-reduce-conflict';
export { ParserException } from './exceptions/parser';
export { SyntaxException } from './exceptions/syntax';

// export interface IParserInfrastructure {
// 	readonly languageSelector: LanguageSelector;
// 	readonly tokenizer: ITokenizer;
// 	readonly grammar: IGrammar;
// 	readonly parser: IParser;
// 	readonly globalInfo: IGlobalInfo;
// }
//
// export function getParserInfrastructure(languageSelector: LanguageSelector): IParserInfrastructure {
// 	// const saslGlobalInfo = new SASLGlobalInfo();
// 	// const grammar = createGrammar(ls);
// 	// const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
// 	// const parser = createParser(ParserSelector.LL1, grammar);
//
// 	// let globalInfo: IGlobalInfo;
//
// 	switch (languageSelector) {
// 		case LanguageSelector.LISP:
// 			globalInfo = new LISPGlobalInfo();
// 			break;
//
// 		default:
// 			throw new Error(`getParserInfrastructure() : Unsupported LanguageSelector ${LanguageSelector[languageSelector]}`);
// 	}
// }
