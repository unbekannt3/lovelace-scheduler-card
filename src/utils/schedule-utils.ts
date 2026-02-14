import type { TimeRange } from '../types/schedule';
import { timeToMinutes } from './time-utils';

/**
 * Check if two time ranges overlap.
 */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
	const aFrom = timeToMinutes(a.from);
	const aTo = timeToMinutes(a.to);
	const bFrom = timeToMinutes(b.from);
	const bTo = timeToMinutes(b.to);
	return aFrom < bTo && bFrom < aTo;
}

/**
 * Check if a new range overlaps with any existing ranges (excluding one by index).
 */
export function hasOverlap(
	ranges: TimeRange[],
	newRange: TimeRange,
	excludeIndex?: number
): boolean {
	return ranges.some((r, i) => i !== excludeIndex && rangesOverlap(r, newRange));
}

/**
 * Sort time ranges by start time.
 */
export function sortRanges(ranges: TimeRange[]): TimeRange[] {
	return [...ranges].sort((a, b) => timeToMinutes(a.from) - timeToMinutes(b.from));
}

/**
 * Validate that a time range has positive duration and doesn't exceed 24h.
 */
export function isValidRange(range: TimeRange): boolean {
	const from = timeToMinutes(range.from);
	const to = timeToMinutes(range.to);
	return from < to && from >= 0 && to <= 1440;
}

/**
 * Find the maximum end time before hitting the next slot (for clamping resize).
 */
export function getMaxEnd(ranges: TimeRange[], currentIndex: number, absoluteMax: number): number {
	const sorted = ranges
		.map((r, i) => ({ from: timeToMinutes(r.from), index: i }))
		.filter((r) => r.index !== currentIndex)
		.sort((a, b) => a.from - b.from);

	const currentFrom = timeToMinutes(ranges[currentIndex].from);

	for (const r of sorted) {
		if (r.from > currentFrom) {
			return r.from;
		}
	}
	return absoluteMax;
}

/**
 * Find the minimum start time before hitting the previous slot (for clamping resize).
 */
export function getMinStart(
	ranges: TimeRange[],
	currentIndex: number,
	absoluteMin: number
): number {
	const sorted = ranges
		.map((r, i) => ({ to: timeToMinutes(r.to), index: i }))
		.filter((r) => r.index !== currentIndex)
		.sort((a, b) => b.to - a.to);

	const currentTo = timeToMinutes(ranges[currentIndex].to);

	for (const r of sorted) {
		if (r.to < currentTo) {
			return r.to;
		}
	}
	return absoluteMin;
}
