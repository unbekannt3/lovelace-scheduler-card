export type ViewMode = 'week' | 'day';

export interface DaySchedulerCardConfig {
	type: 'custom:dayscheduler-card';
	entity: string;
	title?: string;
	default_view?: ViewMode;
	slot_color?: string;
	show_current_time?: boolean;
	card_size?: number;
}

export const DEFAULT_CONFIG = {
	default_view: 'week' as ViewMode,
	start_hour: 0,
	end_hour: 24,
	px_per_hour: 60,
	grid_step: 15,
	slot_color: 'var(--primary-color)',
	show_current_time: true,
	card_size: 8,
};

export function validateConfig(config: unknown): asserts config is DaySchedulerCardConfig {
	if (!config || typeof config !== 'object') {
		throw new Error('Invalid configuration');
	}
	const c = config as Record<string, unknown>;
	if (!c.entity || typeof c.entity !== 'string') {
		throw new Error('You need to define an entity (schedule.*)');
	}
	if (!c.entity.startsWith('schedule.')) {
		throw new Error('Entity must be a schedule entity (schedule.*)');
	}
}
