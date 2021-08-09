// tom-weatherhead/thaw-parser/src/exceptions/internal-error.ts

// import { ExceptionBase } from 'thaw-grammar';

export class InternalErrorException {
	// extends ExceptionBase
	public readonly message: string;
	public readonly line: number;
	public readonly column: number;

	constructor(message: string, line = 0, column = 0) {
		this.message = `InternalErrorException at line ${line} column ${column}: ${message}`;
		this.line = line;
		this.column = column;
	}
}
