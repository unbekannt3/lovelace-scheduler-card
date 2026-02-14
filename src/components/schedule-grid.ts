import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ViewMode, DaySchedulerCardConfig } from '../types/card-config';
import { DEFAULT_CONFIG } from '../types/card-config';
import type { WeekSchedule, TimeRange, DayOfWeek } from '../types/schedule';
import { DAYS_OF_WEEK, DAY_SHORT_KEYS } from '../types/schedule';
import type { DragState } from '../types/drag';
import { localize, type LocaleKey } from '../localize/localize';
import { minutesToPixels, getGridHeight } from '../utils/grid-utils';
import {
	timeToMinutes,
	formatTime,
	getCurrentDayIndex,
	getCurrentMinutes,
} from '../utils/time-utils';
import { gridStyles } from '../styles/grid-styles';

@customElement('schedule-grid')
export class ScheduleGrid extends LitElement {
	static styles = gridStyles;

	@property({ attribute: false }) schedule!: WeekSchedule;
	@property({ attribute: false }) config!: DaySchedulerCardConfig;
	@property({ type: String }) viewMode: ViewMode = 'week';
	@property({ type: Number }) selectedDay = 0;
	@property({ type: Boolean, reflect: true }) editing = false;
	@property({ attribute: false }) dragState: DragState | null = null;
	@property({ type: String }) language = 'en';

	private get startHour(): number {
		return DEFAULT_CONFIG.start_hour;
	}

	private get endHour(): number {
		return DEFAULT_CONFIG.end_hour;
	}

	private get pxPerHour(): number {
		return DEFAULT_CONFIG.px_per_hour;
	}

	private get slotColor(): string {
		return this.config?.slot_color ?? DEFAULT_CONFIG.slot_color;
	}

	private get showCurrentTime(): boolean {
		return this.config?.show_current_time ?? DEFAULT_CONFIG.show_current_time;
	}

	private get gridHeight(): number {
		return getGridHeight(this.startHour, this.endHour, this.pxPerHour);
	}

	private get visibleDays(): { day: DayOfWeek; index: number }[] {
		if (this.viewMode === 'day') {
			return [{ day: DAYS_OF_WEEK[this.selectedDay], index: this.selectedDay }];
		}
		return DAYS_OF_WEEK.map((day, index) => ({ day, index }));
	}

	protected render(): TemplateResult {
		const gridClass = this.viewMode === 'week' ? 'week-view' : 'day-view';
		const todayIndex = getCurrentDayIndex();

		return html`
			<div class="grid-wrapper ${gridClass}">
				<!-- Day headers -->
				<div class="day-header-row">
					<div class="day-header-spacer"></div>
					${this.visibleDays.map(
						({ day, index }) => html`
							<div class="day-header ${index === todayIndex ? 'today' : ''}">
								${localize(DAY_SHORT_KEYS[day] as LocaleKey, this.language)}
							</div>
						`
					)}
				</div>

				<!-- Time axis -->
				<div class="time-axis" style="height: ${this.gridHeight}px">
					<div class="time-axis-container" style="position: relative; height: 100%;">
						${this._renderTimeLabels()}
					</div>
				</div>

				<!-- Day columns -->
				${this.visibleDays.map(({ day, index }) =>
					this._renderDayColumn(day, index, todayIndex)
				)}
			</div>
		`;
	}

	private _renderTimeLabels(): TemplateResult[] {
		const labels: TemplateResult[] = [];
		for (let h = this.startHour; h <= this.endHour; h++) {
			const top = minutesToPixels(h * 60, this.startHour, this.pxPerHour);
			labels.push(html`
				<div class="time-label" style="top: ${top}px">${String(h).padStart(2, '0')}</div>
			`);
		}
		return labels;
	}

	private _renderDayColumn(day: DayOfWeek, dayIndex: number, todayIndex: number): TemplateResult {
		const slots = this.schedule?.[day] || [];
		const columnStyle = `height: ${this.gridHeight}px; position: relative;`;

		return html`
			<div
				class="day-column"
				data-day="${day}"
				data-day-index="${dayIndex}"
				style="${columnStyle}"
				@pointerdown="${this._onPointerDown}"
			>
				${this._renderHourLines()} ${slots.map((slot, i) => this._renderSlot(slot, day, i))}
				${this.dragState?.active && this.dragState.day === day
					? this._renderDragPreview()
					: nothing}
				${this.showCurrentTime && dayIndex === todayIndex
					? this._renderCurrentTimeLine()
					: nothing}
			</div>
		`;
	}

	private _renderHourLines(): TemplateResult[] {
		const lines: TemplateResult[] = [];
		for (let h = this.startHour; h <= this.endHour; h++) {
			const top = minutesToPixels(h * 60, this.startHour, this.pxPerHour);
			lines.push(html`<div class="hour-line" style="top: ${top}px"></div>`);
		}
		return lines;
	}

	private _renderSlot(slot: TimeRange, day: DayOfWeek, index: number): TemplateResult {
		const fromMin = timeToMinutes(slot.from);
		const toMin = timeToMinutes(slot.to);
		const top = minutesToPixels(fromMin, this.startHour, this.pxPerHour);
		const height = minutesToPixels(toMin, this.startHour, this.pxPerHour) - top;
		const fromLabel = formatTime(fromMin);
		const toLabel = formatTime(toMin);

		return html`
			<div
				class="time-slot-block ${this.editing ? 'editing' : ''}"
				style="top: ${top}px; height: ${height}px; background: ${this.slotColor};"
				data-day="${day}"
				data-index="${index}"
			>
				${height > 20
					? html`<span class="slot-label">${fromLabel}<br />${toLabel}</span>`
					: nothing}
				${this.editing
					? html`
							<div
								class="resize-handle top"
								data-day="${day}"
								data-index="${index}"
								data-handle="top"
								@pointerdown="${this._onResizePointerDown}"
							></div>
							<div
								class="resize-handle bottom"
								data-day="${day}"
								data-index="${index}"
								data-handle="bottom"
								@pointerdown="${this._onResizePointerDown}"
							></div>
							<button
								class="delete-button"
								data-day="${day}"
								data-index="${index}"
								@pointerdown="${this._onDeleteClick}"
							>
								✕
							</button>
						`
					: nothing}
			</div>
		`;
	}

	private _renderDragPreview(): TemplateResult {
		if (!this.dragState) return html``;

		const { startMinutes, currentMinutes } = this.dragState;
		const fromMin = Math.min(startMinutes, currentMinutes);
		const toMin = Math.max(startMinutes, currentMinutes);
		const top = minutesToPixels(fromMin, this.startHour, this.pxPerHour);
		const height = minutesToPixels(toMin, this.startHour, this.pxPerHour) - top;
		const label = `${formatTime(fromMin)} - ${formatTime(toMin)}`;

		return html`
			<div
				class="drag-preview"
				style="top: ${top}px; height: ${Math.max(height, 4)}px; background: ${this
					.slotColor};"
			>
				${height > 20 ? html`<span class="slot-label">${label}</span>` : nothing}
			</div>
		`;
	}

	private _renderCurrentTimeLine(): TemplateResult {
		const currentMin = getCurrentMinutes();
		if (currentMin < this.startHour * 60 || currentMin > this.endHour * 60) {
			return html``;
		}
		const top = minutesToPixels(currentMin, this.startHour, this.pxPerHour);
		return html`<div class="current-time-line" style="top: ${top}px"></div>`;
	}

	private _onPointerDown(e: PointerEvent): void {
		if (!this.editing) return;

		// Don't start drag on slot elements (let resize/delete handle those)
		const target = e.target as HTMLElement;
		if (
			target.closest('.time-slot-block') ||
			target.closest('.resize-handle') ||
			target.closest('.delete-button')
		) {
			return;
		}

		const column = target.closest('.day-column') as HTMLElement;
		if (!column) return;

		const day = column.dataset.day as DayOfWeek;
		const rect = column.getBoundingClientRect();
		const y = e.clientY - rect.top;

		this.dispatchEvent(
			new CustomEvent('drag-start', {
				detail: { mode: 'create', day, y, pointerId: e.pointerId, target: column },
				bubbles: true,
				composed: true,
			})
		);
	}

	private _onResizePointerDown(e: PointerEvent): void {
		e.stopPropagation();
		if (!this.editing) return;

		const target = e.target as HTMLElement;
		const handle = target.dataset.handle as 'top' | 'bottom';
		const day = target.dataset.day as DayOfWeek;
		const index = Number(target.dataset.index);
		const column = target.closest('.day-column') as HTMLElement;
		if (!column) return;

		const rect = column.getBoundingClientRect();
		const y = e.clientY - rect.top;

		this.dispatchEvent(
			new CustomEvent('drag-start', {
				detail: {
					mode: handle === 'top' ? 'resize-top' : 'resize-bottom',
					day,
					y,
					slotIndex: index,
					pointerId: e.pointerId,
					target: column,
				},
				bubbles: true,
				composed: true,
			})
		);
	}

	private _onDeleteClick(e: PointerEvent): void {
		e.stopPropagation();
		e.preventDefault();
		const target = e.target as HTMLElement;
		const day = target.dataset.day as DayOfWeek;
		const index = Number(target.dataset.index);

		this.dispatchEvent(
			new CustomEvent('slot-delete', {
				detail: { day, index },
				bubbles: true,
				composed: true,
			})
		);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'schedule-grid': ScheduleGrid;
	}
}
