/**
 * Convert a pixel Y position within a day column to minutes.
 */
export function pixelToMinutes(
	pixelY: number,
	containerHeight: number,
	startHour: number,
	endHour: number
): number {
	const totalMinutes = (endHour - startHour) * 60;
	const ratio = pixelY / containerHeight;
	return startHour * 60 + ratio * totalMinutes;
}

/**
 * Convert minutes to a percentage position within the grid.
 */
export function minutesToPercent(minutes: number, startHour: number, endHour: number): number {
	const totalMinutes = (endHour - startHour) * 60;
	const offsetMinutes = minutes - startHour * 60;
	return (offsetMinutes / totalMinutes) * 100;
}

/**
 * Convert minutes to pixel position.
 */
export function minutesToPixels(minutes: number, startHour: number, pxPerHour: number): number {
	return ((minutes - startHour * 60) / 60) * pxPerHour;
}

/**
 * Get total grid height in pixels.
 */
export function getGridHeight(startHour: number, endHour: number, pxPerHour: number): number {
	return (endHour - startHour) * pxPerHour;
}
