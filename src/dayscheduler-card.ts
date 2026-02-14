import { LitElement, html, type TemplateResult, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { HomeAssistant } from './types/home-assistant';
import type { DaySchedulerCardConfig, ViewMode } from './types/card-config';
import { DEFAULT_CONFIG, validateConfig } from './types/card-config';
import type { WeekSchedule, DayOfWeek, ScheduleEntry } from './types/schedule';
import { DAYS_OF_WEEK, DAY_SHORT_KEYS, toWeekSchedule } from './types/schedule';
import type { DragMode } from './types/drag';
import type { TimeRange } from './types/schedule';
import { ScheduleService } from './services/schedule-service';
import { DragController } from './services/drag-controller';
import { localize, type LocaleKey } from './localize/localize';
import { sortRanges } from './utils/schedule-utils';
import { getCurrentDayIndex, getCurrentMinutes } from './utils/time-utils';
import { minutesToPixels } from './utils/grid-utils';
import { cardStyles } from './styles/card-styles';
import { CARD_TAG_NAME, EDITOR_TAG_NAME } from './constants/defaults';

import './components/schedule-grid';

@customElement(CARD_TAG_NAME)
export class DaySchedulerCard extends LitElement {
	static styles = cardStyles;

	@property({ attribute: false }) hass!: HomeAssistant;

	@state() private _config!: DaySchedulerCardConfig;
	@state() private _scheduleEntry: ScheduleEntry | null = null;
	@state() private _scheduleData: WeekSchedule | null = null;
	@state() private _pendingSchedule: WeekSchedule | null = null;
	@state() private _editing = false;
	@state() private _viewMode: ViewMode = 'week';
	@state() private _selectedDay: number = getCurrentDayIndex();
	@state() private _loading = true;
	@state() private _error: string | null = null;
	@state() private _saving = false;

	@query('.scroll-container') private _scrollContainer!: HTMLElement;

	private _dragController = new DragController(this);
	private _currentTimeInterval: ReturnType<typeof setInterval> | null = null;
	private _hasScrolledToTime = false;

	static getConfigElement(): HTMLElement {
		return document.createElement(EDITOR_TAG_NAME);
	}

	static getStubConfig(): Record<string, unknown> {
		return {
			entity: 'schedule.',
		};
	}

	setConfig(config: DaySchedulerCardConfig): void {
		validateConfig(config);
		this._config = config;
		this._viewMode = config.default_view ?? DEFAULT_CONFIG.default_view;
	}

	getCardSize(): number {
		return this._config?.card_size ?? DEFAULT_CONFIG.card_size;
	}

	getGridOptions() {
		return {
			columns: 12,
			min_columns: 6,
			rows: this._config?.card_size ?? DEFAULT_CONFIG.card_size,
			min_rows: 4,
		};
	}

	connectedCallback(): void {
		super.connectedCallback();
		this._startCurrentTimeUpdates();
		this.addEventListener('drag-commit', this._onDragCommit as EventListener);
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this._stopCurrentTimeUpdates();
		this.removeEventListener('drag-commit', this._onDragCommit as EventListener);
	}

	protected willUpdate(changedProps: PropertyValues): void {
		if (changedProps.has('hass') && this._config?.entity) {
			const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
			const entityId = this._config.entity;

			// Reload if entity state changed or first load
			if (
				!oldHass ||
				!oldHass.states[entityId] ||
				oldHass.states[entityId] !== this.hass.states[entityId]
			) {
				this._loadSchedule();
			}
		}

		// Update drag controller config
		this._dragController.config = {
			startHour: DEFAULT_CONFIG.start_hour,
			endHour: DEFAULT_CONFIG.end_hour,
			pxPerHour: DEFAULT_CONFIG.px_per_hour,
			gridStep: DEFAULT_CONFIG.grid_step,
		};
	}

	protected updated(changedProps: PropertyValues): void {
		super.updated(changedProps);

		// Auto-scroll to current time on first data load
		if (!this._hasScrolledToTime && !this._loading && this._scheduleData) {
			this._hasScrolledToTime = true;
			this._scrollToCurrentTime();
		}
	}

	protected render(): TemplateResult {
		if (!this._config) {
			return html`<ha-card><div class="error-message">No configuration</div></ha-card>`;
		}

		const entityId = this._config.entity;
		const entity = this.hass?.states[entityId];
		const title = this._config.title || entity?.attributes.friendly_name || entityId;

		return html`
			<ha-card>
				${this._renderHeader(title)}
				${this._error
					? html`<div class="error-message">${this._error}</div>`
					: this._loading
						? html`<div class="loading">
								${localize('card.loading', this.hass?.language)}
							</div>`
						: this._renderGrid()}
			</ha-card>
		`;
	}

	private _renderHeader(title: string): TemplateResult {
		const lang = this.hass?.language;

		return html`
			<div class="card-header">
				<div class="card-header-left">
					<span class="card-title">${title}</span>
					${this._viewMode === 'day'
						? html`
								<div class="day-nav">
									<button class="header-button" @click="${this._prevDay}">
										<ha-icon icon="mdi:chevron-left"></ha-icon>
									</button>
									<span class="day-label">
										${localize(
											DAY_SHORT_KEYS[
												DAYS_OF_WEEK[this._selectedDay]
											] as LocaleKey,
											lang
										)}
									</span>
									<button class="header-button" @click="${this._nextDay}">
										<ha-icon icon="mdi:chevron-right"></ha-icon>
									</button>
								</div>
							`
						: ''}
				</div>
				<div class="card-header-right">
					${this._editing
						? html`
								<div class="edit-actions">
									<button
										class="header-button cancel"
										@click="${this._onCancel}"
										title="${localize('card.cancel', lang)}"
										?disabled="${this._saving}"
									>
										<ha-icon icon="mdi:close"></ha-icon>
									</button>
									<button
										class="header-button save"
										@click="${this._onSave}"
										title="${localize('card.save', lang)}"
										?disabled="${this._saving}"
									>
										<ha-icon icon="mdi:check"></ha-icon>
									</button>
								</div>
							`
						: html`
								<button
									class="header-button ${this._viewMode === 'day'
										? 'active'
										: ''}"
									@click="${this._toggleView}"
									title="${this._viewMode === 'week'
										? localize('card.day', lang)
										: localize('card.week', lang)}"
								>
									<ha-icon
										icon="${this._viewMode === 'week'
											? 'mdi:calendar-today'
											: 'mdi:calendar-week'}"
									></ha-icon>
								</button>
								<button
									class="header-button"
									@click="${this._onEdit}"
									title="${localize('card.edit', lang)}"
								>
									<ha-icon icon="mdi:pencil"></ha-icon>
								</button>
							`}
				</div>
			</div>
		`;
	}

	private _renderGrid(): TemplateResult {
		const schedule = this._editing ? this._pendingSchedule! : this._scheduleData!;

		if (!schedule) return html``;

		return html`
			<div class="scroll-container">
				<schedule-grid
					.schedule="${schedule}"
					.config="${this._config}"
					.viewMode="${this._viewMode}"
					.selectedDay="${this._selectedDay}"
					.editing="${this._editing}"
					.dragState="${this._dragController.state}"
					.language="${this.hass?.language || 'en'}"
					@drag-start="${this._onDragStart}"
					@slot-delete="${this._onSlotDelete}"
				></schedule-grid>
			</div>
		`;
	}

	private _scrollToCurrentTime(): void {
		this.updateComplete.then(() => {
			requestAnimationFrame(() => {
				const container = this._scrollContainer;
				if (!container) return;

				const startHour = DEFAULT_CONFIG.start_hour;
				const pxPerHour = DEFAULT_CONFIG.px_per_hour;
				const currentMin = getCurrentMinutes();
				const scrollTarget = minutesToPixels(currentMin, startHour, pxPerHour);

				container.scrollTop = Math.max(0, scrollTarget - container.clientHeight / 3);
			});
		});
	}

	private async _loadSchedule(): Promise<void> {
		if (!this.hass || !this._config?.entity) return;

		try {
			const entry = await ScheduleService.loadSchedule(this.hass, this._config.entity);

			if (entry) {
				this._scheduleEntry = entry;
				this._scheduleData = toWeekSchedule(entry);
				this._error = null;
			} else {
				this._error = localize('card.not_found', this.hass.language);
			}
		} catch (err) {
			console.error('Failed to load schedule:', err);
			this._error = localize('card.error', this.hass.language);
		} finally {
			this._loading = false;
		}
	}

	private _onEdit(): void {
		if (!this._scheduleData) return;
		this._pendingSchedule = ScheduleService.cloneSchedule(this._scheduleData);
		this._editing = true;
	}

	private async _onSave(): Promise<void> {
		console.log('[dayscheduler] _onSave called', {
			pendingSchedule: !!this._pendingSchedule,
			scheduleEntry: this._scheduleEntry,
			hass: !!this.hass,
		});
		if (!this._pendingSchedule || !this._scheduleEntry || !this.hass) return;

		this._saving = true;
		try {
			console.log(
				'[dayscheduler] saving:',
				this._scheduleEntry.id,
				'data:',
				this._pendingSchedule
			);
			await ScheduleService.saveSchedule(
				this.hass,
				this._scheduleEntry,
				this._pendingSchedule
			);
			console.log('[dayscheduler] save succeeded');
			this._scheduleData = this._pendingSchedule;
			this._pendingSchedule = null;
			this._editing = false;
		} catch (err) {
			console.error('[dayscheduler] save failed:', err);
		} finally {
			this._saving = false;
		}
	}

	private _onCancel(): void {
		this._pendingSchedule = null;
		this._editing = false;
	}

	private _toggleView(): void {
		if (this._viewMode === 'week') {
			this._viewMode = 'day';
			this._selectedDay = getCurrentDayIndex();
		} else {
			this._viewMode = 'week';
		}
	}

	private _prevDay(): void {
		this._selectedDay = (this._selectedDay + 6) % 7;
	}

	private _nextDay(): void {
		this._selectedDay = (this._selectedDay + 1) % 7;
	}

	private _onDragStart(e: CustomEvent): void {
		const { mode, day, y, pointerId, target, slotIndex } = e.detail;
		this._dragController.startDrag(mode, day, y, target, pointerId, slotIndex);
	}

	private _onDragCommit = (e: CustomEvent): void => {
		if (!this._pendingSchedule) return;

		const { mode, day, range, slotIndex } = e.detail as {
			mode: DragMode;
			day: DayOfWeek;
			range: TimeRange;
			slotIndex?: number;
		};

		const validated = DragController.validateDragResult(
			this._pendingSchedule,
			day,
			range,
			mode,
			slotIndex
		);

		if (!validated) return;

		// Clone to trigger reactivity
		const newSchedule = ScheduleService.cloneSchedule(this._pendingSchedule);

		if (mode === 'create') {
			newSchedule[day].push(validated);
		} else if ((mode === 'resize-top' || mode === 'resize-bottom') && slotIndex !== undefined) {
			newSchedule[day][slotIndex] = validated;
		}

		newSchedule[day] = sortRanges(newSchedule[day]);
		this._pendingSchedule = newSchedule;
	};

	private _onSlotDelete(e: CustomEvent): void {
		if (!this._pendingSchedule) return;

		const { day, index } = e.detail as { day: DayOfWeek; index: number };
		const newSchedule = ScheduleService.cloneSchedule(this._pendingSchedule);
		newSchedule[day].splice(index, 1);
		this._pendingSchedule = newSchedule;
	}

	private _startCurrentTimeUpdates(): void {
		this._currentTimeInterval = setInterval(() => {
			this.requestUpdate();
		}, 60_000);
	}

	private _stopCurrentTimeUpdates(): void {
		if (this._currentTimeInterval) {
			clearInterval(this._currentTimeInterval);
			this._currentTimeInterval = null;
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[CARD_TAG_NAME]: DaySchedulerCard;
	}
}
