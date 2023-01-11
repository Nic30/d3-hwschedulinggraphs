
module.exports = {
	// required to support typescript in jest tests
	presets: [
		['@babel/preset-env', { targets: { node: 'current' } }],
		'@babel/preset-typescript',
	],

};