// rollup.config.js

/**
 * Copyright (c) Tom Weatherhead. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
	input: './dist/lib/main.js',
	output: [
		{
			file: 'dist/thaw-parser.cjs.js',
			format: 'cjs',
			exports: 'named' //,
			// plugins: [nodeResolve()]
		},
		{
			file: 'dist/thaw-parser.esm.js',
			format: 'es',
			esModule: true,
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
	],
	context: 'this',
	plugins: [nodeResolve()]
};
