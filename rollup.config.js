//import merge from 'deepmerge';
// 
//export default merge(baseConfig, {
//  // any <script type="module"> inside will be bundled by rollup (if input is html)
//  input: './src/d3-hwschedulinggraphs.ts',
//  output: {
//      entryFileNames: `['name'].js`
//  },
//  plugins: [
//  ]
//});
import typescript from '@rollup/plugin-typescript';
const definition = require('./package.json')
const production = false; //!process.env.ROLLUP_WATCH

const mainConfig = {
	input: 'src/d3-hwschedulinggraphs.ts',
	output: {
		extend: true,
		//dir: 'dist',
		sourcemap: !production,
		//format: 'iife',
		//format: 'cjs',
		format: 'umd',
		file: definition.main,
		globals: {
			// lib name: name where lib exports itself on "window"
			"d3": "d3",
		},
		name: 'd3',
	},
	external: ['d3'],
	plugins: [
		//resolve({
		//  jsnext: true,
		//  module: true,
		//}),
		typescript({ sourceMap: !production, inlineSources: !production })
	]
};
const typesConfig = {
	input: 'src/d3-hwschedulinggraphs.d.ts',
	output: {
		extend: true,
		//dir: 'dist',
		sourcemap: !production,
		//format: 'iife',
		//format: 'cjs',
		format: 'umd',
		file: definition.main,
		globals: {
			// lib name: name where lib exports itself on "window"
			"d3": "d3",
		},
		name: 'd3',
	},
	external: ['d3'],
	plugins: [
		//resolve({
		//  jsnext: true,
		//  module: true,
		//}),
		typescript({ sourceMap: !production, inlineSources: !production, tsconfig: "tsconfig.types.json" })
	]
};
export default [mainConfig];