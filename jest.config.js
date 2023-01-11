/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	verbose: true,
	testEnvironment: 'jsdom',
	// transformIgnorePatterns, transform required to support export in node_modules/d3/src/index.js:1
	"transformIgnorePatterns": [
		"!node_modules/"
	],
	"transform": {
      "^.+\\.[t|j]sx?$": "babel-jest"
    }
};
