export interface HassEntity {
	entity_id: string;
	state: string;
	attributes: {
		friendly_name?: string;
		icon?: string;
		[key: string]: unknown;
	};
	last_changed: string;
	last_updated: string;
}

export interface HassEntities {
	[entity_id: string]: HassEntity;
}

export interface HassUser {
	id: string;
	is_owner: boolean;
	is_admin: boolean;
	name: string;
}

export interface HassLocale {
	language: string;
	number_format: string;
	time_format: string;
	first_weekday?: number;
}

export interface HomeAssistant {
	states: HassEntities;
	user?: HassUser;
	locale: HassLocale;
	language: string;
	localize(key: string, replace?: Record<string, string>): string;
	callService(
		domain: string,
		service: string,
		data?: Record<string, unknown>,
		target?: { entity_id?: string | string[] }
	): Promise<void>;
	callWS<T>(msg: Record<string, unknown>): Promise<T>;
}
