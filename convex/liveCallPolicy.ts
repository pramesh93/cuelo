export const MAX_CALL_TEXT_CHARACTERS=500000;
export const MAX_CALL_UTTERANCES=7000;
export const MAX_UTTERANCE_CHARACTERS=2000;
export const CALL_DURATION_MS=3600000;
export function liveCallConfig(env:Record<string,string|undefined>=process.env){
 const read=(name:string,max:number)=>{const n=Number(env[name]);return Number.isSafeInteger(n)&&n>0&&n<=max?n:0;};
 const config={sessions:read('LIVE_CALL_TEST_SESSION_LIMIT',100),connections:read('LIVE_CALL_MAX_CONNECTIONS',10),detections:read('LIVE_CALL_MAX_DETECTIONS',1000),answers:read('LIVE_CALL_MAX_ANSWERS',120),reservePaise:read('LIVE_CALL_RESERVE_PAISE',450000)};
 return env.LIVE_CALL_TESTING_ENABLED==='true'&&env.V1_PAID_TESTING_ENABLED==='true'&&env.DEEPGRAM_API_KEY&&env.OPENAI_API_KEY&&Object.values(config).every(Boolean)?config:null;
}
export function checkCallText(text:string,characters:number,utterances:number){
 const clean=text.trim();if(!clean||clean.length>MAX_UTTERANCE_CHARACTERS)throw Error('The spoken turn is too long to keep safely. Cuelo has stopped; ask a shorter question in a new session.');
 if(characters+clean.length>MAX_CALL_TEXT_CHARACTERS||utterances>=MAX_CALL_UTTERANCES)throw Error('This call reached its text capacity. Cuelo has stopped; no conversation was silently removed.');
 return clean;
}
