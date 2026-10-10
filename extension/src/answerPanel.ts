export type AnswerPanel<T>={result:T|null;previousAnswers:T[]};
// Keep completed answers while speech or a replacement request is pending.
export function showAnswer<T>(panel:AnswerPanel<T>,answer:T):AnswerPanel<T>{
 return {result:answer,previousAnswers:panel.result?[panel.result,...panel.previousAnswers]:panel.previousAnswers};
}
