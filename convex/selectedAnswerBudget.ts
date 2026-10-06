import {v,ConvexError} from 'convex/values';
import {internalMutation,internalQuery,mutation,query} from './_generated/server';
import {ownerKey} from './sources';
import {answerAttemptLimit} from './testingLimits';
import {budgetDecision,spendingMonth} from './spendingPolicy';
export const ANSWER_RESERVATION_PAISE=2000; // ₹20 estimate with input/output/hosting margin, not a provider charge.
const args={visitSecret:v.string(),requestKey:v.string()};
export const admit=internalMutation({args,returns:v.object({remaining:v.number(),budgetAlert:v.boolean()}),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.visitSecret);const now=Date.now();
 if(process.env.V1_PAID_TESTING_ENABLED!=='true'||process.env.EVALUATION_TESTING_ENABLED!=='true')throw new ConvexError('Live answer checks are not enabled yet.');
 if(!/^[a-f0-9-]{36}$/.test(args.requestKey))throw new ConvexError('Start a fresh question and try again.');
 const request=(await ctx.db.query('answerRequests').withIndex('by_key',q=>q.eq('key',args.requestKey)).take(1))[0];
 if(request)throw new ConvexError(request.cancelled?'This answer was cancelled.':'This answer request was already used. Ask a fresh question.');
 const spent=(await ctx.db.query('spendingReservations').withIndex('by_key',q=>q.eq('key',`answer-${args.requestKey}`)).take(1))[0];if(spent)throw new ConvexError('This answer request was already used. Ask a fresh question.');
 const visit=(await ctx.db.query('answerVisits').withIndex('by_owner',q=>q.eq('ownerKey',key)).take(1))[0];
 // Abandoned visits expire. The current browser capability remains resettable.
 const successful=visit&&visit.expiresAt>now?visit.successful:0;
 if(successful>=5)throw new ConvexError('You’ve used your five free answers. Sign up to continue.');
 const usage=(await ctx.db.query('evaluationUsage').withIndex('by_scope',q=>q.eq('scope','milestone1')).take(1))[0];
 if((usage?.count??0)>=answerAttemptLimit())throw new ConvexError('The development answer allowance is used up. Paid requests have stopped.');
 const month=spendingMonth(now);const ledger=(await ctx.db.query('spendingMonths').withIndex('by_month',q=>q.eq('month',month)).take(1))[0];
 const decision=budgetDecision(ledger?.reservedPaise??0,ANSWER_RESERVATION_PAISE);if(!decision.allowed)throw new ConvexError('The testing budget is reached. New paid answers have stopped.');
 // All checks and reservations are atomic; disabled/exhausted admission writes nothing.
 if(visit?.activeKey){const old=(await ctx.db.query('answerRequests').withIndex('by_key',q=>q.eq('key',visit.activeKey!)).take(1))[0];if(old&&old.ownerKey===key)await ctx.db.patch(old._id,{cancelled:true});}
 const values={successful,activeKey:args.requestKey,activeUntil:now+45000,expiresAt:now+86400000};
 if(visit)await ctx.db.patch(visit._id,values);else await ctx.db.insert('answerVisits',{ownerKey:key,...values});
 await ctx.db.insert('answerRequests',{key:args.requestKey,ownerKey:key,cancelled:false,expiresAt:now+45000});
 if(usage)await ctx.db.patch(usage._id,{count:usage.count+1,reservedUsd:usage.reservedUsd+.2});else await ctx.db.insert('evaluationUsage',{scope:'milestone1',count:1,reservedUsd:.2});
 const spending={reservedPaise:(ledger?.reservedPaise??0)+ANSWER_RESERVATION_PAISE,reservations:(ledger?.reservations??0)+1};
 if(ledger)await ctx.db.patch(ledger._id,spending);else await ctx.db.insert('spendingMonths',{month,...spending});
 await ctx.db.insert('spendingReservations',{key:`answer-${args.requestKey}`,month,purpose:'opening',amountPaise:ANSWER_RESERVATION_PAISE});
 return {remaining:5-successful,budgetAlert:decision.alert};
}});
export const status=query({args:{visitSecret:v.string()},returns:v.object({enabled:v.boolean(),remaining:v.number(),attemptsRemaining:v.number()}),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.visitSecret);const visit=(await ctx.db.query('answerVisits').withIndex('by_owner',q=>q.eq('ownerKey',key)).take(1))[0];const usage=(await ctx.db.query('evaluationUsage').withIndex('by_scope',q=>q.eq('scope','milestone1')).take(1))[0];
 return {enabled:process.env.V1_PAID_TESTING_ENABLED==='true'&&process.env.EVALUATION_TESTING_ENABLED==='true'&&!!process.env.OPENAI_API_KEY,remaining:5-(visit&&visit.expiresAt>Date.now()?visit.successful:0),attemptsRemaining:Math.max(0,answerAttemptLimit()-(usage?.count??0))};
}});
export const cancelled=internalQuery({args,returns:v.boolean(),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.visitSecret);const row=(await ctx.db.query('answerRequests').withIndex('by_key',q=>q.eq('key',args.requestKey)).take(1))[0];return !row||row.ownerKey!==key||row.cancelled||row.expiresAt<=Date.now();
}});
export const cancel=mutation({args,returns:v.null(),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.visitSecret);if(!/^[a-f0-9-]{36}$/.test(args.requestKey))throw new ConvexError('Invalid answer request.');const row=(await ctx.db.query('answerRequests').withIndex('by_key',q=>q.eq('key',args.requestKey)).take(1))[0];if(row&&row.ownerKey===key)await ctx.db.patch(row._id,{cancelled:true});else if(!row)await ctx.db.insert('answerRequests',{key:args.requestKey,ownerKey:key,cancelled:true,expiresAt:Date.now()+45000});return null;
}});
export const finish=internalMutation({args:{...args,successful:v.boolean()},returns:v.boolean(),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.visitSecret);const row=(await ctx.db.query('answerRequests').withIndex('by_key',q=>q.eq('key',args.requestKey)).take(1))[0];if(!row||row.ownerKey!==key)return false;
 const visit=(await ctx.db.query('answerVisits').withIndex('by_owner',q=>q.eq('ownerKey',key)).take(1))[0];
 const accepted=!!visit&&visit.activeKey===row.key&&!row.cancelled&&row.expiresAt>Date.now()&&args.successful;
 if(visit&&visit.activeKey===row.key)await ctx.db.patch(visit._id,{activeKey:null,activeUntil:0,successful:visit.successful+(accepted?1:0)});
 await ctx.db.delete(row._id);return accepted;
}});
export const cleanup=internalMutation({args:{},returns:v.null(),handler:async ctx=>{
 for(const row of await ctx.db.query('answerRequests').withIndex('by_expiry',q=>q.lte('expiresAt',Date.now())).take(100))await ctx.db.delete(row._id);
 for(const row of await ctx.db.query('answerVisits').withIndex('by_expiry',q=>q.lte('expiresAt',Date.now())).take(100))await ctx.db.delete(row._id);
 return null;
}});
