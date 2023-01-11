import { TimelineData, TimelineItemData } from "./data";


export const createChartBars = (rectangleData: TimelineItemData[], barsContainer: d3.Selection<SVGGElement, TimelineData, HTMLDivElement, undefined>, fontSize: number) => {
	// append tasks only after we have rendered the connections to prevent lines overlapping the tasks

	const bars = barsContainer
		.selectAll('g')
		.data(rectangleData)
		.enter()
		.append('g');

	bars
		.append('rect')
		.attr('rx', 4)
		.attr('ry', 4)
		.attr('x', d => d.x)
		.attr('y', d => d.y)
		.attr('width', d => d.width)
		.attr('height', d => d.height)
		.style('fill', d => d.color)
		.style('stroke', 'black');

	bars
		.append('text')
		.style('fill', d => d.textColor)
		//.style('font-family', 'sans-serif')
		.style('font-family', 'monospace')
		.style('font-size', fontSize + "px")
		.attr('x', d => d.labelX)
		.attr('y', d => d.labelY)
		.text(d => d.label)

	return bars;
};
