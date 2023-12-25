import * as d3 from 'd3';
import { TimelineData, TimelineItemData, TimelineItemPortInRecord } from './data'

export class TimlineLinkData {
	src: TimelineItemData;
	srcPortI: number;
	dst: TimelineItemData;
	dstPortI: number;

	points: string;
	color: string;

	constructor(src: TimelineItemData,
		srcPortI: number,
		dst: TimelineItemData,
		dstPortI: number,

		points: string,
		color: string,
	) {
		this.src = src;
		this.srcPortI = srcPortI;
		this.dst = dst;
		this.dstPortI = dstPortI;
		this.points = points;
		this.color = color;
	}
}

export const createPolylineData = (rectangleData: TimelineItemData[], idToDataDict: { [id: number]: TimelineItemData }, elementHeight: number): TimlineLinkData[] => {
	// used to calculate offsets between elements later
	const storedConnections: { [id: number]: number } = rectangleData.reduce((acc, e) => ({ ...acc, [e.id]: 0 }), {});

	// create data describing connections' lines
	return rectangleData.flatMap((d: TimelineItemData) =>
		d.portsIn
			.map(([t, name, parentId, parentOutI, linkColor]: TimelineItemPortInRecord, inI: number) => {
				const parent = idToDataDict[parentId];
				const srcPort = parent.portsOut[parentOutI];
				// increase the amount rows occupied by both parent and current element (d)
				storedConnections[parent.id]++;
				storedConnections[d.id]++;
				const x0 = srcPort[0];
				const y0 = parent.y;
				const x1 = t;
				const y1 = d.y;

				const deltaParentConnections = storedConnections[parent.id] * (elementHeight / 4);
				const deltaChildConnections = storedConnections[d.id] * (elementHeight / 4);

				const points = [
					x1, (y1 + (elementHeight / 2)),
					x1 - deltaChildConnections, (y1 + (elementHeight / 2)),
					x1 - deltaChildConnections, (y1 - (elementHeight * 0.25)),
					x0 + deltaParentConnections, (y1 - (elementHeight * 0.25)),
					x0 + deltaParentConnections, (y0 + (elementHeight / 2)),
					x0, (y0 + (elementHeight / 2))
				];

				return new TimlineLinkData(
					parent, parentOutI,
					d, inI,
					points.join(','),
					linkColor,
				);
			})
	);
};

export const createPolylines = (linesContainer: d3.Selection<SVGGElement, TimelineData, HTMLDivElement, undefined>,
	rectangleData: TimelineItemData[], idToDataDict: { [id: number]: TimelineItemData }, elementHeight: number
): d3.Selection<SVGPolylineElement, TimlineLinkData, SVGGElement, TimelineData> => {
	const polylineData = createPolylineData(rectangleData, idToDataDict, elementHeight);
	return linesContainer
		.selectAll('polyline')
		.data(polylineData)
		.enter()
		.append('polyline')
		.style('fill', 'none')
		.style("stroke-width", 2)
		.style('stroke', d => d.color)
		.attr('points', d => d.points);
}


export const createBezierCurveData = (rectangleData: TimelineItemData[], idToDataDict: { [id: number]: TimelineItemData }, elementHeight: number): TimlineLinkData[] => {
	// prepare dependencies polyline data
	const min_duration = 1;
	// create data describing connections' lines
	return rectangleData.flatMap((d: TimelineItemData) =>
		d.portsIn
			.map(([t, name, parentId, parentOutI, linkColor]: TimelineItemPortInRecord, inI: number) => {
				const parent = idToDataDict[parentId];
				if (!parent) {
					throw new Error(`Can not find a node ${parentId} for a link src`);
				}
				const srcPort = parent.portsOut[parentOutI];
				if (!srcPort) {
					throw new Error(`Can not find a port ${parentOutI} on node ${parentId} for link src`);
				}
				// increase the amount rows occupied by both parent and current element (d)
				const x0 = srcPort[0];
				const y0 = parent.y + elementHeight / 2;
				const x1 = t;
				const y1 = d.y + elementHeight / 2;
				let jobs_delta = x1 - x0;
				let p: string;
				if (jobs_delta > min_duration && y0 == y1) {
					// directly from src to dst on the same row
					p = `M ${x0} ${y0} L ${x1} ${y1}`;
				} else {
					if (jobs_delta > min_duration) {
						// the distance is too short, it is required to add curve after src and before dst
						let middleX = x0 + jobs_delta / 2;
						p = `M ${x0} ${y0} C ${middleX} ${y0}, ${middleX} ${y1}, ${x1} ${y1}`;
					} else {
						// x0 is on right, x1 on left or
						// line requires some additional curving in order to be not completly overlap with the commections in column 
						const curvingScale = 64;
						p = `M ${x0} ${y0} C ${x0 + curvingScale * min_duration} ${y0}, ${x1 - curvingScale * min_duration} ${y1}, ${x1} ${y1}`;
					}
				}

				return new TimlineLinkData(
					parent, parentOutI,
					d, inI,
					p,
					linkColor,
				);
			})
	);
}


export const createBezierCurves = (linesContainer: d3.Selection<SVGGElement, TimelineData, HTMLDivElement, undefined>,
	rectangleData: TimelineItemData[], idToDataDict: { [id: number]: TimelineItemData }, elementHeight: number
): d3.Selection<SVGPathElement, TimlineLinkData, SVGGElement, TimelineData> => {
	const bezierCurveData = createBezierCurveData(rectangleData, idToDataDict, elementHeight);
	return linesContainer
		.selectAll('path')
		.data(bezierCurveData)
		.enter()
		.append('path')
		.style('fill', 'none')
		.style("stroke-width", 2)
		.style('stroke', d => d.color)
		.attr('d', d => d.points);

}