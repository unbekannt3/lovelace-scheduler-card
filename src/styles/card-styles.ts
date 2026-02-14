import { css } from 'lit';

export const cardStyles = css`
	:host {
		display: block;
		height: 100%;
		--slot-color: var(--scheduler-slot-color, var(--primary-color));
		--slot-color-alpha: var(
			--scheduler-slot-color-alpha,
			rgba(var(--rgb-primary-color, 3, 169, 244), 0.2)
		);
		--grid-line-color: var(--divider-color, rgba(0, 0, 0, 0.12));
		--header-bg: var(--card-background-color, var(--ha-card-background, white));
		--text-primary: var(--primary-text-color, #212121);
		--text-secondary: var(--secondary-text-color, #727272);
	}

	ha-card {
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border-bottom: 1px solid var(--grid-line-color);
	}

	.card-header-left {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.card-title {
		font-size: 16px;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.day-nav {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.day-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
		min-width: 28px;
		text-align: center;
	}

	.card-header-right {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.header-button {
		background: none;
		border: none;
		cursor: pointer;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		transition: background-color 0.2s;
	}

	.header-button:hover {
		background-color: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
	}

	.header-button.active {
		color: var(--primary-color);
	}

	.header-button.save {
		color: var(--primary-color);
	}

	.header-button.cancel {
		color: var(--error-color, #db4437);
	}

	.edit-actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.scroll-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		min-height: 0;
	}

	.error-message {
		padding: 16px;
		color: var(--error-color, #db4437);
		text-align: center;
	}

	.loading {
		padding: 32px;
		text-align: center;
		color: var(--text-secondary);
	}
`;
