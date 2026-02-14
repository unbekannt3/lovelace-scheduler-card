export type DayOfWeek =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
];

export const DAY_SHORT_KEYS: Record<DayOfWeek, string> = {
	monday: 'days.mon',
	tuesday: 'days.tue',
	wednesday: 'days.wed',
	thursday: 'days.thu',
	friday: 'days.fri',
	saturday: 'days.sat',
	sunday: 'days.sun',
};

export interface TimeRange {
	from: string; // "HH:MM:SS"
	to: string; // "HH:MM:SS"
}

export type WeekSchedule = Record<DayOfWeek, TimeRange[]>;

export interface ScheduleEntry {
	id: string;
	name: string;
	icon: string;
	monday: TimeRange[];
	tuesday: TimeRange[];
	wednesday: TimeRange[];
	thursday: TimeRange[];
	friday: TimeRange[];
	saturday: TimeRange[];
	sunday: TimeRange[];
}

export function toWeekSchedule(entry: ScheduleEntry): WeekSchedule {
	return {
		monday: entry.monday,
		tuesday: entry.tuesday,
		wednesday: entry.wednesday,
		thursday: entry.thursday,
		friday: entry.friday,
		saturday: entry.saturday,
		sunday: entry.sunday,
	};
}

export function emptyWeekSchedule(): WeekSchedule {
	return {
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
		saturday: [],
		sunday: [],
	};
}
