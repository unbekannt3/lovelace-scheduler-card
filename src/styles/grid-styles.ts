import { css } from 'lit';

export const gridStyles = css`
	:host {
		display: block;
		position: relative;
	}

	.grid-wrapper {
		display: grid;
		position: relative;
	}

	.grid-wrapper.week-view {
		grid-template-columns: 40px repeat(7, 1fr);
	}

	.grid-wrapper.day-view {
		grid-template-columns: 40px 1fr;
	}

	.day-header-row {
		display: contents;
	}

	.day-header-spacer {
		position: sticky;
		top: 0;
		z-index: 3;
		background: var(--card-background-color, var(--ha-card-background, white));
	}

	.day-header {
		position: sticky;
		top: 0;
		z-index: 3;
		background: var(--card-background-color, var(--ha-card-background, white));
		text-align: center;
		padding: 8px 0;
		font-size: 12px;
		font-weight: 500;
		color: var(--primary-text-color);
		border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
		user-select: none;
	}

	.day-header.today {
		color: var(--primary-color);
		font-weight: 700;
	}

	.time-axis {
		grid-row: 2;
		grid-column: 1;
	}

	.day-column {
		grid-row: 2;
		position: relative;
		border-left: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
	}

	:host([editing]) .day-column {
		touch-action: none;
	}

	.hour-line {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--divider-color, rgba(0, 0, 0, 0.12));
		pointer-events: none;
	}

	.time-slot-block {
		position: absolute;
		left: 2px;
		right: 2px;
		background: var(--slot-color, var(--primary-color));
		border-radius: 4px;
		opacity: 0.85;
		cursor: default;
		overflow: hidden;
		min-height: 4px;
		transition: opacity 0.15s;
		z-index: 1;
	}

	.time-slot-block:hover {
		opacity: 1;
	}

	.time-slot-block.editing {
		cursor: grab;
	}

	.time-slot-block .slot-label {
		display: block;
		font-size: 10px;
		color: white;
		padding: 2px 4px;
		line-height: 1.3;
		text-align: center;
		pointer-events: none;
		user-select: none;
	}

	.time-slot-block .resize-handle {
		position: absolute;
		left: 0;
		right: 0;
		height: 12px;
		cursor: ns-resize;
		z-index: 2;
	}

	.time-slot-block .resize-handle.top {
		top: 0;
	}

	.time-slot-block .resize-handle.bottom {
		bottom: 0;
	}

	.time-slot-block .delete-button {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		border: none;
		cursor: pointer;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		line-height: 1;
		padding: 0;
		z-index: 3;
		display: none;
	}

	/* Show delete button on hover (desktop) and always when editing (touch) */
	.time-slot-block.editing .delete-button {
		display: flex;
	}

	@media (hover: hover) {
		.time-slot-block.editing .delete-button {
			display: none;
		}
		.time-slot-block.editing:hover .delete-button {
			display: flex;
		}
	}

	.drag-preview {
		position: absolute;
		left: 2px;
		right: 2px;
		background: var(--slot-color, var(--primary-color));
		border-radius: 4px;
		opacity: 0.4;
		pointer-events: none;
		z-index: 1;
	}

	.drag-preview .slot-label {
		font-size: 10px;
		color: white;
		padding: 2px 4px;
		pointer-events: none;
		user-select: none;
	}

	.current-time-line {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--error-color, #db4437);
		z-index: 2;
		pointer-events: none;
	}

	.current-time-line::before {
		content: '';
		position: absolute;
		left: -4px;
		top: -3px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--error-color, #db4437);
	}

	/* Time axis styles */
	.time-axis-container {
		position: relative;
	}

	.time-label {
		position: absolute;
		right: 4px;
		font-size: 10px;
		color: var(--secondary-text-color, #727272);
		transform: translateY(-50%);
		user-select: none;
	}
`;
