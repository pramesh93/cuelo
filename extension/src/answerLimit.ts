export function answerLimitReached(completed:number,limit:number){return limit>0&&completed>=limit;}
export function limitReachedView(limit:number){
 return {state:'limited' as const,message:`${limit===4?'Four':limit}-answer test limit reached. Audio and transcription are off. Your answers remain below.`,busy:false,warning:false,questionQueue:undefined,audioStats:undefined};
}
