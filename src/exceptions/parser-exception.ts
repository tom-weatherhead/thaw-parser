// tom-weatherhead/thaw-parser/src/exceptions/parser-exception.ts

// import { ExceptionBase } from 'thaw-grammar';

export class ParserException {
	// extends ExceptionBase
	public readonly message: string;
	public readonly line: number;
	public readonly column: number;

	constructor(message: string, line = 0, column = 0) {
		this.message = `ParserException at line ${line} column ${column}: ${message}`;
		this.line = line;
		this.column = column;
	}
}
