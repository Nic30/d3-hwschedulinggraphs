const htmlEscapes: { [s: string]: string } = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#x27;',
	'/': '&#x2F;'
};

// Regex containing the keys listed immediately above.
const htmlEscaper = /[&<>"'\/]/g;

// Escape a string for HTML interpolation.
export const htmlEscape = function(text: string) {
	return text.replace(htmlEscaper, function(match: string): string {
		return htmlEscapes[match];
	});
};