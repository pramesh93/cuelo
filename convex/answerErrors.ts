import {ConvexError} from 'convex/values';
export const WEBSITE_TEST_LIMIT='The development testing allowance is used up. Ask for another test batch.';
export const BUDGET_EXHAUSTED='Cuelo’s budget has been exhausted. Please try again later.';
export const ANSWER_NOT_FOUND='Answer not found.';
export const CONTACT_CUELO='Something went wrong with Cuelo. Please contact the Cuelo team.';
export const CUELO_UNAVAILABLE='Cuelo is temporarily unavailable. Please contact the Cuelo team.';
export const SERVICE_UNAVAILABLE='The answer service is unavailable. Please try again shortly.';
export const ANSWER_TIMEOUT='This is taking longer than expected. Please try again.';
export function answerErrorMessage(error:unknown,depth=0):string {
 if(error instanceof ConvexError&&typeof error.data==='string'){
  if(error.data===WEBSITE_TEST_LIMIT)return WEBSITE_TEST_LIMIT;
  if(/budget/i.test(error.data))return BUDGET_EXHAUSTED;
  if(/testing is unavailable|not (?:enabled|configured)|real answers are not configured/i.test(error.data))return CUELO_UNAVAILABLE;
  return error.data;
 }
 const value=error as {name?:string;statusCode?:number;status?:number;cause?:unknown;data?:{error?:{code?:string}}}|null;
 if(value?.name==='TimeoutError'||value?.name==='AbortError')return ANSWER_TIMEOUT;
 const status=value?.statusCode??value?.status;
 if(status===401||status===403||status===400||status===404)return CONTACT_CUELO;
 if(status===402||value?.data?.error?.code==='insufficient_quota')return BUDGET_EXHAUSTED;
 if(status===429)return 'Busy right now. Try again in a few minutes.';
 if(status&&status>=500||value?.name==='TypeError')return SERVICE_UNAVAILABLE;
 if(depth<2&&value?.cause&&value.cause!==error){const nested=answerErrorMessage(value.cause,depth+1);if(nested!==CONTACT_CUELO)return nested;}
 return CONTACT_CUELO;
}
