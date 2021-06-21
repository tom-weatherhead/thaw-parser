// tom-weatherhead/thaw-parser/src/iparser.ts

import { Token } from 'thaw-lexical-analyzer';

export interface IParser {
	recognize(tokenList: Token[]): void;
	parse(tokenList: Token[]): unknown;
}
