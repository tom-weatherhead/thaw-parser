// tom-weatherhead/thaw-parser/src/main.ts

export { ParserSelector } from 'thaw-grammar';

export { createParser } from './parser-factory';
export { IParser } from './iparser';

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
