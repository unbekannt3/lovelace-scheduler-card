/**
 * Parse a time string "HH:MM:SS" or "HH:MM" to total minutes from midnight.
 */
export function timeToMinutes(time: string): number {
	const parts = time.split(':').map(Number);
	return parts[0] * 60 + parts[1];
}

/**
 * Convert total minutes to "HH:MM:SS" format.
 */
export function minutesToTime(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/**
 * Snap minutes to the nearest grid step.
 */
export function snapToGrid(minutes: number, step: number): number {
	return Math.round(minutes / step) * step;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Format minutes for display: "08:00"
 */
export function formatTime(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Get current time as total minutes from midnight.
 */
export function getCurrentMinutes(): number {
	const now = new Date();
	return now.getHours() * 60 + now.getMinutes();
}

/**
 * Get current day of the week index (0 = Monday, 6 = Sunday).
 */
export function getCurrentDayIndex(): number {
	const day = new Date().getDay();
	// JS: 0=Sun, 1=Mon, ..., 6=Sat → we want 0=Mon, ..., 6=Sun
	return day === 0 ? 6 : day - 1;
}
