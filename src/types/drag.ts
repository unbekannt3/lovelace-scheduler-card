import type { DayOfWeek } from './schedule';

export type DragMode = 'create' | 'resize-top' | 'resize-bottom';

export interface DragState {
	active: boolean;
	mode: DragMode;
	day: DayOfWeek;
	startMinutes: number;
	currentMinutes: number;
	slotIndex?: number; // index of slot being resized
	pointerId?: number;
}

export function createEmptyDragState(): DragState {
	return {
		active: false,
		mode: 'create',
		day: 'monday',
		startMinutes: 0,
		currentMinutes: 0,
	};
}
