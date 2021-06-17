// rollup.config.js

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { terser } = require('rollup-plugin-terser');

export default [
	{
		input: './dist/types/main.js',
		output: [
			{
				file: 'dist/thaw-parser.cjs.js',
				format: 'cjs',
				exports: 'named'
			},
			{
				file: 'dist/thaw-parser.esm.js',
				format: 'es',
				compact: true,
				plugins: [terser()]
			},
			{
				file: 'dist/thaw-parser.js',
				name: 'thaw-parser',
				format: 'umd',
				compact: true,
				plugins: [terser()]
			}
		]
	}
];
