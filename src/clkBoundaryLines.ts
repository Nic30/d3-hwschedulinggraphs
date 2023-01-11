import { TimelineData } from "./data";

export const createClockGridLines = (plotArea: d3.Selection<SVGGElement, TimelineData, HTMLDivElement, undefined>,
	xScale: d3.ScaleLinear<number, number, never>,
	height: number, clkPeriod: number, minStart: number, maxEnd: number) => {

	var clkTickTimes = [];
	var t = Math.floor(minStart / clkPeriod) * clkPeriod;
	var end = Math.ceil(maxEnd / clkPeriod) * clkPeriod;
	while (t < end) {
		clkTickTimes.push(t);
		t += clkPeriod;
	}
	var xValues = clkTickTimes
		.map(function(d) {
			return xScale(d);
		});
	// add the X gridlines (parallel with x axis)
	var clkLines = plotArea.selectAll<SVGLineElement, number[]>('.clk-line')
		.data(xValues);
	clkLines
		.enter()
		.append('line')
		.attr('class', 'clk-line')
		.attr('stroke-dasharray', '5,5') // make line sashed
		.merge(clkLines)
		.attr('x1', function(d) { return d; })
		.attr('y1', 0)
		.attr('x2', function(d) { return d; })
		.attr('y2', height);

	clkLines.exit().remove();
	return clkLines;
}
