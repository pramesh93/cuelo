export type AnswerDiagnostics={speechStarts:number;requests:number;responses:number;displayed:number;events:string[]};
export const emptyDiagnostics=():AnswerDiagnostics=>({speechStarts:0,requests:0,responses:0,displayed:0,events:[]});
export function recordDiagnostic(state:AnswerDiagnostics,event:string,counter?:'speechStarts'|'requests'|'responses'|'displayed'):AnswerDiagnostics{
 return {...state,...(counter?{[counter]:state[counter]+1}:{}),events:[event,...state.events].slice(0,12)};
}
