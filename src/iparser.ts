// tom-weatherhead/thaw-parser/src/iparser.ts

'use strict';

import { Token } from 'thaw-lexical-analyzer';

export interface IParser {
	recognize(tokenList: Token[]): void;
	parse(tokenList: Token[]): any;
}
