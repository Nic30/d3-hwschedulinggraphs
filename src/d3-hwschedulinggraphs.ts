import * as d3 from 'd3';
import { createChartBars } from './bars';
import { createClockGridLines } from './clkBoundaryLines';
import { Margin, TimelineData, sortElements, findBoundaries, createElementData, TimelineItem, TimelineItemData, createDataCacheById } from './data'
import { createBezierCurves, createPolylines, TimlineLinkData } from './links';
// based on https://shybovycha.github.io/2017/04/09/gantt-chart-with-d3.html
//          https://stackoverflow.com/questions/72581298/how-to-zoom-only-on-the-x-axis-in-a-line-chart-in-d3-js-v7
//          https://stackoverflow.com/questions/32959056/responsive-d3-zoom-behavior


/**
 * @var currentlySelected set of currently selected tasks and links, if it is empty all items has opacity 1 if this is not empty
 *	the items in this set has opacity 1 and others 0.5
 * @var margin margin between svg outer boundary and intern body
 * @var svgWidth current width of SVG element
 * @var svgHeight current height of SVG element
 * @var graphWidth current width of main body in SVG element
 * @var graphHeight current height of main body in SVG element
 * @var fontSize size used for font of task labels
 * @var elementHeight height of task in graph
 * @var showRelations if true the dependencies between tasks are shown otherwise they are ignored
 * @var tooltip an element for tooltip which will show on mouseover over various elements in graph
 * @var svgContainer a container where main SVG should be placed
 * @var svg main SVG element where all things are rendered
 * @var plotAreaZoomed a svg g element for the objects where zoom behavior should be applied
 * @var reverseHighlighOppacity an oppacity which is used to un-highlight the not highlighted elemenets on mouse over
 * @var applyHighlight a function which highlights object which are placed in currentlySelected
 * @var idToSuccessorIds a dictionary mapping node id to successors ids
 */
export class HwSchedulingTimelineGraph {
	margin: Margin;
	svgWidth: number;
	svgHeight: number;
	graphWidth: number;
	graphHeight: number;
	fontSize: number;
	elementHeight: number;
	showRelations: boolean;
	reverseHighlighOppacity: number;

	tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null;
	svgContainer: d3.Selection<HTMLDivElement, unknown, null, undefined>;
	svg: d3.Selection<SVGSVGElement, TimelineData, HTMLDivElement, undefined> | null = null;
	zoom: d3.ZoomBehavior<SVGSVGElement, TimelineData> | null = null;
	plotAreaZoomed: d3.Selection<SVGGElement, TimelineData, HTMLDivElement, undefined> | null = null;

	xScale: d3.ScaleLinear<number, number, never> | null = null;
	xScaleOrig: d3.ScaleLinear<number, number, never> | null = null;
	xAxis: d3.Axis<d3.NumberValue> | null = null;
	xAxisG: d3.Selection<SVGGElement, TimelineData, HTMLDivElement, undefined> | null = null;
	currentlySelected: Set<TimelineItemData | TimlineLinkData>;

	minStart: number;
	maxEnd: number;
	data: TimelineData;
	dataNormalized: TimelineItemData[];
	idToDataDict: { [id: number]: TimelineItemData };
	idToSuccessorIds: { [predecessorId: number]: number[] };
	applyHighlight: () => void;

	constructor(svgContainer: HTMLDivElement, data: TimelineData,
		elementHeight: number = 20, showRelations: boolean = true, fontSize: number = 8) {
		this.margin = {
			top: elementHeight,
			left: 0,
			bottom: 0,
			right: 0,
		};
		this.reverseHighlighOppacity = 0.2;

		this.svgContainer = d3.select(svgContainer);

		this.fontSize = fontSize;
		// prepare data
		data.data = sortElements(data.data);
		this.data = data;
		this.dataNormalized = [];
		this.idToDataDict = {};
		this.idToSuccessorIds = HwSchedulingTimelineGraph._getSuccessorIdsDict(data.data);
		this.elementHeight = elementHeight;

		const { minStart, maxEnd } = findBoundaries(data.data);
		this.currentlySelected = new Set();
		this.minStart = minStart;
		this.maxEnd = maxEnd;
		this.showRelations = showRelations;
		this.svgWidth = 0;
		this.svgHeight = 0;
		this.graphWidth = 0;
		this.graphHeight = 0;
		this.resolveSizes();
		this.applyHighlight = () => { };
		if (window.ResizeObserver) {
			new window.ResizeObserver(this.resolveSizes.bind(this)).observe(svgContainer)
		}
	}
	/**
	 * Creates dictionary of id to list of successor ids.
	 *
	 * @param nodes To be searched
	 * @return dictionary of id to list of successor ids
	 */
	static _getSuccessorIdsDict(nodes: TimelineItem[]) {
		const dict: { [id: number]: number[] } = {};
		for (const item of nodes) {
			dict[item.id] = [];
		}
		for (const item of nodes) {
			for (const port of item.portsIn) {
				const predecessorID = port[2];
				const successorList = dict[predecessorID];
				successorList.push(item.id);
			}
		}
		return dict;
	}

	resolveSizes() {
		var container = this.svgContainer.node();
		if (!container) {
			throw new Error("Can not resolve sizes because parent node is not specified " + container);
		}
		var rect = container.getBoundingClientRect();
		const prevWidth = this.svgWidth;
		const prevHeight = this.svgHeight;
		this.svgWidth = rect.width;
		this.svgHeight = rect.height;
		this.graphWidth = rect.width - this.margin.left - this.margin.right;
		this.graphHeight = rect.height - this.margin.top - this.margin.bottom;
		if (this.svg) {
			this.svg
				.attr("width", this.svgWidth)
				.attr("height", this.svgHeight);
			if (this.xScaleOrig) {
				this.xScaleOrig.range([0, this.graphWidth]);
			}
			if (this.xScale) {
				this.xScale.range([0, this.graphWidth]);
				if (this.xScale !== null && this.xAxis !== null && this.xAxisG !== null) {
					this.xAxisG.call(this.xAxis);
					//this.xAxisG.call(this.xAxis.scale(this.xScale));
				}
			}
			if (this.zoom && this.plotAreaZoomed) {
				// keep top left corner in place
				const xScaleRatio = this.svgWidth / prevWidth;
				this.zoom.scaleBy(this.svg, xScaleRatio);
				// if width decreases we must move up in y because scale changed and image visually moved down
				// y<0 moves image up
				const yOffset = (this.svgHeight * (xScaleRatio - 1)) / 2;
				this.zoom.translateBy(this.svg, (this.svgWidth - prevWidth) / 2, yOffset);
			}
		}
	}
	//// timeline.zoomToTask(timeline.idToDataDict[23], 0.5)
	//zoomToTask(task: TimelineItemData, screenPerc: number) {
	//	let g = this.plotAreaZoomed;
	//	if (!g)
	//		return;
	//	let xOffset = -task.x;
	//	let yOffset = -task.y;
	//	let width = this.svgWidth;
	//	let height = this.svgHeight;
	//
	//	const w = task.width || 1;
	//	const h = task.height || 1;
	//	// scale everything so that it fits the specified size
	//	let scale = Math.min(width / w, height / h);
	//	// centering
	//	xOffset += ((width / scale - task.width) / 2);
	//	yOffset += ((height / scale - task.height) / 2);
	//	scale *= screenPerc;
	//	// if a transformation group was specified we
	//	// perform a 'zoomToFit'
	//	const t = new d3.ZoomTransform(scale, xOffset * scale, yOffset * scale);
	//	g.transition()
	//		.duration(200)
	//		.attr("transform", t.toString());
	//}
	draw() {
		var svg = this.svg;
		var tooltip = this.tooltip;
		if (svg === null) {
			const _svg = this.svgContainer.selectAll<SVGSVGElement, TimelineData>('svg').data([this.data]);
			svg = this.svg = _svg.enter()
				.append('svg')
				.classed("hwscheduling-timeline-graph", true)
				.attr("width", this.svgWidth)
				.attr("height", this.svgHeight)
				;
		}
		if (tooltip === null) {
			//this.svgContainer
			tooltip = this.tooltip = d3.select('body')
				.append("div")
				.attr("class", "hwscheduling-timeline-graph tooltip")
				.style("display", "none");
		}
		// create container element for the whole chart
		const margin = this.margin;
		const xScaleOrig = this.xScaleOrig = d3.scaleLinear()
			.domain([this.minStart, this.maxEnd])
			.range([0, this.graphWidth]);
		let xScale = this.xScale = xScaleOrig.copy();

		// prepare data for every data element
		const rectangleData = this.dataNormalized = createElementData(this.data.data, this.elementHeight, xScale, this.fontSize);
		this.idToDataDict = createDataCacheById(rectangleData);
		const xAxis = this.xAxis = d3.axisBottom(xScale);
		const xAxisG = this.xAxisG = svg.append("g")
			.classed("axis-x", true)
			.attr("transform", "translate(" + [0, 0] + ")")
			.call(xAxis);
		const _this = this;
		const zoom = this.zoom = d3.zoom<SVGSVGElement, TimelineData>()
			.scaleExtent([0.5, (this.maxEnd - this.minStart)])
			//.translateExtent([[minStart, 0], [maxEnd, 0]])
			.on("zoom", function(event): void {
				const zoomState: d3.ZoomTransform = event.transform;
				const zoomWithOffset = new d3.ZoomTransform(
					zoomState.k,
					zoomState.x + margin.left,
					zoomState.y + margin.top);
				if (_this && _this.plotAreaZoomed) {
					_this.plotAreaZoomed.attr('transform', zoomWithOffset.toString());
				}
				_this.xScale = event.transform.rescaleX(_this.xScaleOrig);
				if (_this.xScale)
					xAxisG.call(xAxis.scale(_this.xScale));
			});

		this.plotAreaZoomed = svg.call(zoom).append('g').attr('transform', `translate(${margin.left},${margin.top})`);
		let lines: d3.Selection<any, TimlineLinkData, SVGGElement, TimelineData> | null = null;
		// add milestone relationship lines to the SVG
		if (this.showRelations) {
			// create data describing connections' lines
			const linesContainer = this.plotAreaZoomed.append('g');
			lines = createBezierCurves(linesContainer, rectangleData, this.idToDataDict, this.elementHeight);
			//lines = createPolylines(linesContainer, rectangleData, this.elementHeight);

		}
		const maxRow = Math.max(...rectangleData.map((d: TimelineItem) => {
			return d.row;
		}))
		createClockGridLines(this.plotAreaZoomed, xScale, maxRow * 2 * this.elementHeight, this.data.clkPeriod, this.minStart, this.maxEnd);

		const barsContainer = this.plotAreaZoomed.append('g');
		const bars = createChartBars(rectangleData, barsContainer, this.fontSize);
		const selected = this.currentlySelected;
		function applyHighlight() {
			if (selected.size) {
				if (lines)
					lines.style("opacity", (d) => selected.has(d) ? 1 : _this.reverseHighlighOppacity);

				bars.style("opacity", (d) => selected.has(d) ? 1 : _this.reverseHighlighOppacity);
			} else {
				if (lines)
					lines.style("opacity", 1);

				bars.style("opacity", 1);
			}
		}
		this.applyHighlight = applyHighlight
		function cancelTmpHighlight() {
			// return to original highlight state and hide tooltip
			if (tooltip) {
				tooltip.html(" ").style("display", "none");
			}
			applyHighlight()
		}
		if (lines) {
			lines
				.on("mousemove", function(ev, d) {
					// temporarly highlight this edge and connected tasks and display tooltip
					if (tooltip) {
						tooltip.style("display", "none");
						tooltip
							.html(() => {
								let srcPort = d.src.portsOut[d.srcPortI];
								let dstPort = d.dst.portsIn[d.dstPortI];
								return [`${d.src.id}:${d.srcPortI} ${srcPort[1] ? srcPort[1] : ''} ${srcPort[0]}ns`,
									'->',
								`${d.dst.id}:${d.dstPortI} ${dstPort[1] ? dstPort[1] : ''} ${dstPort[0]}ns`].join("</br>");
							})
							.style("left", (ev.pageX + 12) + "px")
							.style("top", (ev.pageY - 10) + "px")
							.style("opacity", 1)
							.style("display", "block");
					}
					var currentLineData = d;
					if (lines) {
						lines.style("opacity", (d) => {
							if (d === currentLineData) {
								return 1;
							} else {
								return _this.reverseHighlighOppacity;
							}
						});
						bars.style("opacity", (d) => {
							if (d === currentLineData.src || d === currentLineData.dst) {
								return 1;
							} else {
								return _this.reverseHighlighOppacity;
							}
						});
					}
				})
				.on("mouseout", cancelTmpHighlight)
				.on("click", function(ev, d) {
					if (selected.has(d)) {
						selected.delete(d);
					} else {
						selected.add(d);
					}
				});
		}
		bars
			.on("mousemove", function(ev, d) {
				// temporarly highlight this task connected edges and tasks and display tooltip
				if (tooltip) {
					tooltip.style("display", "none");
					tooltip
						.html(() => d.tooltip)
						.style("left", (ev.pageX + 12) + "px")
						.style("top", (ev.pageY - 10) + "px")
						.style("opacity", 1)
						.style("display", "block");
				}
				var currentData = d;

				function isConnected(otherTask: TimelineItem) {
					for (const p of d.portsIn) {
						if (p[2] === otherTask.id) {
							// selected node depends on this node
							return true;
						}
					}
					for (const p of otherTask.portsIn) {
						if (p[2] === d.id) {
							// this node depends on selected node
							return true;
						}
					}
					return false;
				}

				if (lines) {
					lines.style("opacity", (d) => {
						if (d.src === currentData || d.dst === currentData) {
							return 1;
						} else {
							return _this.reverseHighlighOppacity;
						}
					});
				}
				bars.style("opacity", (d) => {
					if (d === currentData || isConnected(d)) {
						return 1;
					} else {
						return _this.reverseHighlighOppacity;
					}
				});
			})
			.on("mouseout", cancelTmpHighlight)
			.on("click", function(ev, d) {
				if (selected.has(d)) {
					selected.delete(d);
				} else {
					selected.add(d);
				}
			});
	}
}

