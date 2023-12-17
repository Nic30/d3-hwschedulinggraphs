import { TimelineData, TimelineItemData } from "./data";


export const createChartBars = (rectangleData: TimelineItemData[], barsContainer: d3.Selection<SVGGElement, TimelineData, HTMLDivElement, undefined>, fontSize: number) => {
	// append tasks only after we have rendered the connections to prevent lines overlapping the tasks

	const bars = barsContainer
		.selectAll('g')
		.data(rectangleData)
		.enter()
		.append('g')
		;

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
	const charWidth = fontSize * 0.6;

	//const singleCharWidth = fontSize * 0.5;
	//const singleCharHeight = fontSize * 0.45;
	bars
		.append('text')
		.style('fill', d => d.textColor)
		//.style('font-family', 'sans-serif')
		.style('font-family', 'monospace')
		//.style('font-size', `${fontSize}px`)
		.style('font-size', d => (Math.min(
					 d.height*.45,
					 fontSize* (d.width / (d.label.length * charWidth)))) + "px")
		.style('text-anchor', "middle")
		.attr('dominant-baseline', 'middle')
		.attr('x', d => d.x + d.width / 2)
		.attr('y', d => d.y + d.height / 2)
		.text((d) => {
			let label = d.label;
			return label;
		})
	//.attr('viewBox', d => `${d.x} ${d.y} ${d.width} ${d.height}`);


	return bars;
};
