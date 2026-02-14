import './dayscheduler-card-editor';
import './dayscheduler-card';

import { CARD_TAG_NAME, CARD_NAME, CARD_DESCRIPTION } from './constants/defaults';

interface CustomCardEntry {
	type: string;
	name: string;
	description: string;
}

// Register card with Home Assistant's custom card picker
const win = window as unknown as Record<string, unknown>;
win.customCards = (win.customCards as CustomCardEntry[] | undefined) || [];
(win.customCards as CustomCardEntry[]).push({
	type: CARD_TAG_NAME,
	name: CARD_NAME,
	description: CARD_DESCRIPTION,
});

console.info(
	`%c ${CARD_NAME} %c loaded`,
	'color: white; background: #3498db; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
	'color: #3498db; background: #e8e8e8; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;'
);
