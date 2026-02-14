import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import type { DragState, DragMode } from '../types/drag';
import type { DayOfWeek, TimeRange, WeekSchedule } from '../types/schedule';
import { pixelToMinutes, getGridHeight } from '../utils/grid-utils';
import { snapToGrid, clamp, minutesToTime } from '../utils/time-utils';
import { hasOverlap, getMaxEnd, getMinStart } from '../utils/schedule-utils';
import { MIN_SLOT_DURATION } from '../constants/defaults';

export interface DragControllerConfig {
	startHour: number;
	endHour: number;
	pxPerHour: number;
	gridStep: number;
}

export class DragController implements ReactiveController {
	private host: ReactiveControllerHost & HTMLElement;
	private _state: DragState | null = null;
	private _column: HTMLElement | null = null;
	private _config: DragControllerConfig = {
		startHour: 0,
		endHour: 24,
		pxPerHour: 60,
		gridStep: 15,
	};

	get state(): DragState | null {
		return this._state;
	}

	set config(c: DragControllerConfig) {
		this._config = c;
	}

	constructor(host: ReactiveControllerHost & HTMLElement) {
		this.host = host;
		host.addController(this);
	}

	hostConnected(): void {
		// Pointer move/up are captured on the host for stable tracking
	}

	hostDisconnected(): void {
		this._cleanup();
	}

	startDrag(
		mode: DragMode,
		day: DayOfWeek,
		y: number,
		column: HTMLElement,
		pointerId: number,
		slotIndex?: number
	): void {
		const gridHeight = getGridHeight(
			this._config.startHour,
			this._config.endHour,
			this._config.pxPerHour
		);
		const rawMinutes = pixelToMinutes(
			y,
			gridHeight,
			this._config.startHour,
			this._config.endHour
		);
		const snapped = snapToGrid(rawMinutes, this._config.gridStep);
		const clamped = clamp(snapped, this._config.startHour * 60, this._config.endHour * 60);

		this._state = {
			active: true,
			mode,
			day,
			startMinutes: clamped,
			currentMinutes: clamped,
			slotIndex,
			pointerId,
		};
		this._column = column;

		column.setPointerCapture(pointerId);
		column.addEventListener('pointermove', this._onPointerMove);
		column.addEventListener('pointerup', this._onPointerUp);
		column.addEventListener('pointercancel', this._onPointerCancel);

		this.host.requestUpdate();
	}

	private _onPointerMove = (e: PointerEvent): void => {
		if (!this._state || !this._column) return;

		const rect = this._column.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const gridHeight = getGridHeight(
			this._config.startHour,
			this._config.endHour,
			this._config.pxPerHour
		);
		const rawMinutes = pixelToMinutes(
			y,
			gridHeight,
			this._config.startHour,
			this._config.endHour
		);
		const snapped = snapToGrid(rawMinutes, this._config.gridStep);
		const clamped = clamp(snapped, this._config.startHour * 60, this._config.endHour * 60);

		this._state = { ...this._state, currentMinutes: clamped };
		this.host.requestUpdate();
	};

	private _onPointerUp = (_e: PointerEvent): void => {
		if (!this._state) return;

		const result = this._computeResult();
		this._cleanup();
		this.host.requestUpdate();

		if (result) {
			this.host.dispatchEvent(
				new CustomEvent('drag-commit', {
					detail: result,
					bubbles: true,
					composed: true,
				})
			);
		}
	};

	private _onPointerCancel = (): void => {
		this._cleanup();
		this.host.requestUpdate();
	};

	private _computeResult(): {
		mode: DragMode;
		day: DayOfWeek;
		range: TimeRange;
		slotIndex?: number;
	} | null {
		if (!this._state) return null;

		const { mode, day, startMinutes, currentMinutes, slotIndex } = this._state;

		if (mode === 'create') {
			const from = Math.min(startMinutes, currentMinutes);
			const to = Math.max(startMinutes, currentMinutes);
			if (to - from < MIN_SLOT_DURATION) return null;
			return {
				mode,
				day,
				range: { from: minutesToTime(from), to: minutesToTime(to) },
			};
		}

		if (mode === 'resize-top' || mode === 'resize-bottom') {
			return {
				mode,
				day,
				range: {
					from: minutesToTime(mode === 'resize-top' ? currentMinutes : startMinutes),
					to: minutesToTime(mode === 'resize-bottom' ? currentMinutes : startMinutes),
				},
				slotIndex,
			};
		}

		return null;
	}

	/**
	 * Validate and clamp a drag result against existing slots.
	 */
	static validateDragResult(
		schedule: WeekSchedule,
		day: DayOfWeek,
		range: TimeRange,
		mode: DragMode,
		slotIndex?: number
	): TimeRange | null {
		const slots = schedule[day];
		let from = parseInt(range.from.split(':')[0]) * 60 + parseInt(range.from.split(':')[1]);
		let to = parseInt(range.to.split(':')[0]) * 60 + parseInt(range.to.split(':')[1]);

		if (mode === 'create') {
			if (to - from < MIN_SLOT_DURATION) return null;
			const newRange: TimeRange = { from: minutesToTime(from), to: minutesToTime(to) };
			if (hasOverlap(slots, newRange)) return null;
			return newRange;
		}

		if (mode === 'resize-top' && slotIndex !== undefined) {
			const minStart = getMinStart(slots, slotIndex, 0);
			from = Math.max(from, minStart);
			to =
				parseInt(slots[slotIndex].to.split(':')[0]) * 60 +
				parseInt(slots[slotIndex].to.split(':')[1]);
			if (to - from < MIN_SLOT_DURATION) from = to - MIN_SLOT_DURATION;
			return { from: minutesToTime(from), to: minutesToTime(to) };
		}

		if (mode === 'resize-bottom' && slotIndex !== undefined) {
			from =
				parseInt(slots[slotIndex].from.split(':')[0]) * 60 +
				parseInt(slots[slotIndex].from.split(':')[1]);
			const maxEnd = getMaxEnd(slots, slotIndex, 1440);
			to = Math.min(to, maxEnd);
			if (to - from < MIN_SLOT_DURATION) to = from + MIN_SLOT_DURATION;
			return { from: minutesToTime(from), to: minutesToTime(to) };
		}

		return null;
	}

	private _cleanup(): void {
		if (this._column && this._state?.pointerId !== undefined) {
			try {
				this._column.releasePointerCapture(this._state.pointerId);
			} catch {
				// Already released
			}
			this._column.removeEventListener('pointermove', this._onPointerMove);
			this._column.removeEventListener('pointerup', this._onPointerUp);
			this._column.removeEventListener('pointercancel', this._onPointerCancel);
		}
		this._state = null;
		this._column = null;
	}
}
