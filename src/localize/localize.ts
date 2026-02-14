import en from './locales/en.json';
import de from './locales/de.json';

type DeepKeys<T, Prefix extends string = ''> = T extends object
	? {
			[K in keyof T & string]: T[K] extends object
				? DeepKeys<T[K], `${Prefix}${K}.`>
				: `${Prefix}${K}`;
		}[keyof T & string]
	: never;

export type LocaleKey = DeepKeys<typeof en>;

const translations: Record<string, Record<string, unknown>> = { en, de };

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
	const keys = path.split('.');
	let current: unknown = obj;
	for (const key of keys) {
		if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
			current = (current as Record<string, unknown>)[key];
		} else {
			return undefined;
		}
	}
	return typeof current === 'string' ? current : undefined;
}

export function localize(key: LocaleKey, language?: string): string {
	const lang = language || 'en';
	const langBase = lang.split('-')[0];

	const value =
		(translations[lang] && getNestedValue(translations[lang], key)) ||
		(translations[langBase] && getNestedValue(translations[langBase], key)) ||
		getNestedValue(translations['en'], key);

	return value || key;
}
