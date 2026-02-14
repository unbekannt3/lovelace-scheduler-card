import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from './types/home-assistant';
import type { DaySchedulerCardConfig } from './types/card-config';
import { localize } from './localize/localize';
import { editorStyles } from './styles/editor-styles';
import { EDITOR_TAG_NAME } from './constants/defaults';

interface HaFormSchema {
	name: string;
	label?: string;
	selector?: Record<string, unknown>;
	required?: boolean;
	default?: unknown;
}

@customElement(EDITOR_TAG_NAME)
export class DaySchedulerCardEditor extends LitElement {
	static styles = editorStyles;

	@property({ attribute: false }) hass!: HomeAssistant;
	@state() private _config!: DaySchedulerCardConfig;

	setConfig(config: DaySchedulerCardConfig): void {
		this._config = config;
	}

	private get _schema(): HaFormSchema[] {
		const lang = this.hass?.language;
		return [
			{
				name: 'entity',
				label: localize('editor.entity', lang),
				required: true,
				selector: {
					entity: { domain: 'schedule' },
				},
			},
			{
				name: 'title',
				label: localize('editor.title', lang),
				selector: { text: {} },
			},
			{
				name: 'default_view',
				label: localize('editor.default_view', lang),
				default: 'week',
				selector: {
					select: {
						options: [
							{ value: 'week', label: localize('card.week', lang) },
							{ value: 'day', label: localize('card.day', lang) },
						],
					},
				},
			},
			{
				name: 'show_current_time',
				label: localize('editor.show_current_time', lang),
				default: true,
				selector: { boolean: {} },
			},
		];
	}

	protected render(): TemplateResult {
		if (!this._config || !this.hass) return html``;

		return html`
			<div class="editor-container">
				<ha-form
					.hass="${this.hass}"
					.data="${this._config}"
					.schema="${this._schema}"
					.computeLabel="${this._computeLabel}"
					@value-changed="${this._valueChanged}"
				></ha-form>
			</div>
		`;
	}

	private _computeLabel = (schema: HaFormSchema): string => {
		return schema.label || schema.name;
	};

	private _valueChanged(e: CustomEvent): void {
		const newConfig = e.detail.value as DaySchedulerCardConfig;
		this._config = newConfig;

		this.dispatchEvent(
			new CustomEvent('config-changed', {
				detail: { config: newConfig },
				bubbles: true,
				composed: true,
			})
		);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[EDITOR_TAG_NAME]: DaySchedulerCardEditor;
	}
}
