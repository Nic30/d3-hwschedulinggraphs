import { htmlEscape } from "./htmlEscape";

export class Margin {
	top: number;
	right: number;
	bottom: number;
	left: number;
	constructor(top: number,
		right: number,
		bottom: number,
		left: number,
	) {
		this.top = top;
		this.right = right;
		this.bottom = bottom;
		this.left = left;
	}
}

// tuple (abs. time, name, dependency TimelineItem, dependency port index, linkColor)
export type TimelineItemPortInRecord = [number, string, number, number, string];

/**
 * A single task item in input scheduling graph.
 */
export class TimelineItem {
	id: number; // an unique id to identify task
	start: number; // a time when task starts
	end: number; // a time when task ends
	label: string; // task label displayed on taks node
	row: number; // y-axis position of the task
	color: string; // color of the task node
	textColor: string; // color of the text in task node

	portsIn: TimelineItemPortInRecord[]; // definition of input ports and its connections
	portsOut: [number, string][];  // tuples (abs. time, name)
	genericDeps: number[]; // additional task dependencies which are displaied usig dashed line

	constructor(
		id: number,
		start: number,
		end: number,
		label: string,
		row: number,
		color: string,
		textColor: string,
		portsIn: TimelineItemPortInRecord[],
		portsOut: [number, string][],
		genericDeps: number[]
	) {
		this.id = id;
		this.start = start;
		this.end = end;
		this.label = label;
		this.row = row;
		this.color = color;
		this.textColor = textColor;
		this.portsIn = portsIn;
		this.portsOut = portsOut;
		this.genericDeps = genericDeps;
	}
};

/**
 * Represents the complete input data for this timeline graph
 */
export class TimelineData {
	clkPeriod: number;
	data: TimelineItem[];
	constructor(clkPeriod: number, data: TimelineItem[]) {
		this.clkPeriod = clkPeriod;
		this.data = data;
	}
}

/**
 * An enritched TimelineItem object which is used for internal representation of scheduling tasks.
 */
export class TimelineItemData extends TimelineItem {
	x: number;
	y: number;
	xEnd: number;
	width: number;
	height: number;
	label: string;
	tooltip: string;

	constructor(
		originalObj: TimelineItem,
		x: number,
		y: number,
		xEnd: number,
		width: number,
		height: number,
		label: string,
		tooltip: string
	) {
		super(
			originalObj.id,
			originalObj.start,
			originalObj.end,
			originalObj.label,
			originalObj.row,
			originalObj.color,
			originalObj.textColor,
			originalObj.portsIn,
			originalObj.portsOut,
			originalObj.genericDeps,
		)
		this.x = x;
		this.y = y;
		this.xEnd = xEnd;
		this.width = width;
		this.height = height;
		this.label = label;
		this.tooltip = tooltip;
	}
}

export const findBoundaries = (data: TimelineItem[]) => {
	let minStart: number = Infinity, maxEnd: number = 0;

	for (const { start, end } of data) {
		if (start < minStart) minStart = start;
		if (end < minStart) minStart = end;
		if (end > maxEnd) maxEnd = end;
		if (start > maxEnd) maxEnd = start;
	}

	return {
		minStart,
		maxEnd
	};
};

export function createDataCacheById(data: TimelineItemData[]): { [id: number]: TimelineItemData } {
	return data.reduce((cache, elt) => ({ ...cache, [elt.id]: elt }), {});
};


export const sortElements = (data: TimelineItem[]): TimelineItem[] => {
	return data.sort((e1: TimelineItem, e2: TimelineItem) => {
		if (e1.end < e2.end)
			return -1;
		else
			return 1;
	});
};

export const createElementData = (data: TimelineItem[], elementHeight: number, xScale: d3.ScaleContinuousNumeric<number, number, never>, fontSize: number) =>
	data.map((d: TimelineItem) => {
		const x = xScale(d.start);
		const xEnd = xScale(d.end);
		const y = d.row * elementHeight * 1.5;
		const width = xEnd - x;
		const height = elementHeight;
		const tooltip = htmlEscape(d.label);

		d.portsIn = d.portsIn.map(([t, name, dep, depOutI, linkColor]) => {
			return [xScale(t), name, dep, depOutI, linkColor];
		});
		d.portsOut = d.portsOut.map(([t, name]) => {
			return [xScale(t), name]
		});
		return new TimelineItemData(
			d,
			x,
			y,
			xEnd,
			width,
			height,
			d.label,
			tooltip
		);
	});