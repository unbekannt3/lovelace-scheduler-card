import type { HomeAssistant } from '../types/home-assistant';
import type { ScheduleEntry, WeekSchedule, DayOfWeek } from '../types/schedule';
import { DAYS_OF_WEEK } from '../types/schedule';

export class ScheduleService {
	/**
	 * Load all schedules from HA and find the one matching the entity_id.
	 */
	static async loadSchedule(
		hass: HomeAssistant,
		entityId: string
	): Promise<ScheduleEntry | null> {
		const schedules = await hass.callWS<ScheduleEntry[]>({
			type: 'schedule/list',
		});

		const scheduleId = entityId.replace('schedule.', '');
		return schedules.find((s) => s.id === scheduleId) || null;
	}

	/**
	 * Save a week schedule to HA.
	 */
	static async saveSchedule(
		hass: HomeAssistant,
		entry: ScheduleEntry,
		schedule: WeekSchedule
	): Promise<void> {
		const msg: Record<string, unknown> = {
			type: 'schedule/update',
			schedule_id: entry.id,
			name: entry.name,
			icon: entry.icon,
		};

		for (const day of DAYS_OF_WEEK) {
			msg[day] = schedule[day];
		}

		await hass.callWS(msg);
	}

	/**
	 * Deep clone a week schedule for pending edits.
	 */
	static cloneSchedule(schedule: WeekSchedule): WeekSchedule {
		const clone: Partial<WeekSchedule> = {};
		for (const day of DAYS_OF_WEEK) {
			clone[day as DayOfWeek] = schedule[day].map((r) => ({ ...r }));
		}
		return clone as WeekSchedule;
	}
}
