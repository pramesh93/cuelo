type Trial = {callsUsed:number; callsRemaining:number; remainingMs:number; exhausted:boolean};
export function trialMessage(trial:Trial){
 if(trial.exhausted)return 'Your free trial has ended. Paid plans are coming soon.';
 if(trial.callsUsed===0)return 'Your free trial includes 3 calls or 90 meeting minutes, whichever runs out first.';
 return `${trial.callsRemaining} free ${trial.callsRemaining===1?'call':'calls'} · ${Math.ceil(trial.remainingMs/60000)} free meeting minutes remaining.`;
}
