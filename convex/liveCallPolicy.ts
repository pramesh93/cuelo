export const MAX_CALL_TEXT_CHARACTERS=500000;
export const MAX_CALL_UTTERANCES=7000;
export const MAX_UTTERANCE_CHARACTERS=2000;
export const CALL_DURATION_MS=3600000;
export function liveCallConfig(env:Record<string,string|undefined>=process.env){
 const read=(name:string,max:number)=>{const n=Number(env[name]);return Number.isSafeInteger(n)&&n>0&&n<=max?n:0;};
 const production=env.CONVEX_CLOUD_URL==='https://deafening-frog-846.convex.cloud';
 // Zero means no answer-count limit; production uses the account call/minute trial.
 const config={sessions:read('LIVE_CALL_TEST_SESSION_LIMIT',100),connections:read('LIVE_CALL_MAX_CONNECTIONS',10),detections:read('LIVE_CALL_MAX_DETECTIONS',1000),answers:production?0:read('LIVE_CALL_MAX_ANSWERS',120),reservePaise:read('LIVE_CALL_RESERVE_PAISE',450000)};
 return env.LIVE_CALL_TESTING_ENABLED==='true'&&env.V1_PAID_TESTING_ENABLED==='true'&&env.DEEPGRAM_API_KEY&&env.OPENAI_API_KEY&&Object.entries(config).every(([key,value])=>key==='answers'&&production?true:!!value)?config:null;
}
export function checkCallText(text:string,characters:number,utterances:number){
 const clean=text.trim();if(!clean||clean.length>MAX_UTTERANCE_CHARACTERS)throw Error('The spoken turn is too long to keep safely. Cuelo has stopped; ask a shorter question in a new session.');
 if(characters+clean.length>MAX_CALL_TEXT_CHARACTERS||utterances>=MAX_CALL_UTTERANCES)throw Error('This call reached its text capacity. Cuelo has stopped; no conversation was silently removed.');
 return clean;
}
