export const OPENING_DAILY_LIMIT=3;
export const OPENING_RESERVATION_PAISE=2100;
const offset=330*60*1000;
export function openingDay(now:number){return new Date(now+offset).toISOString().slice(0,10);}
export function openingReset(now:number){return Date.parse(openingDay(now)+'T00:00:00Z')+86400000-offset;}
export function openingEnabled(env:Record<string,string|undefined>){return env.V1_PAID_TESTING_ENABLED==='true'&&env.OPENING_DEMO_TESTING_ENABLED==='true'&&!!env.OPENAI_API_KEY&&!!env.DEEPGRAM_API_KEY;}
