import {BUDGET_EXHAUSTED} from './answerErrors';
import {WEBSITE_TEST_LIMIT} from './answerErrors';
import {v,ConvexError} from 'convex/values';
import {query,internalMutation} from './_generated/server';
import {getAuthUserId} from '@convex-dev/auth/server';
import {ownerKey} from './sources';
import {openingDay,openingReset,openingEnabled,OPENING_DAILY_LIMIT,OPENING_RESERVATION_PAISE} from './openingPolicy';
import {answerAttemptLimit} from './testingLimits';
import {spendingMonth,budgetDecision,allocationLimit} from './spendingPolicy';
const args={browserSecret:v.string()};
function openingLimit(name:string,fallback:number){const value=process.env[name];if(value===undefined)return fallback;const n=Number(value);return Number.isSafeInteger(n)&&n>0&&n<=100?n:0;}
export const status=query({args:{...args,day:v.string()},returns:v.object({enabled:v.boolean(),remaining:v.number(),resetAt:v.number(),signedIn:v.boolean(),busy:v.boolean()}),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.browserSecret),now=Date.now();const row=(await ctx.db.query('openingUsage').withIndex('by_owner',q=>q.eq('ownerKey',key)).take(1))[0];
 return {enabled:openingEnabled(process.env),remaining:Math.max(0,OPENING_DAILY_LIMIT-(row?.day===openingDay(now)?row.attempts:0)),resetAt:openingReset(now),signedIn:!!await getAuthUserId(ctx),busy:!!row&&row.activeUntil>now};
}});
export const admit=internalMutation({args:{...args,requestKey:v.string()},returns:v.object({remaining:v.number(),budgetAlert:v.boolean()}),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.browserSecret),now=Date.now(),day=openingDay(now);
 if(await getAuthUserId(ctx))throw new ConvexError('You’re signed in. Open My account to set up Cuelo for a call.');
 const row=(await ctx.db.query('openingUsage').withIndex('by_owner',q=>q.eq('ownerKey',key)).take(1))[0];const used=row?.day===day?row.attempts:0;
 if(used>=OPENING_DAILY_LIMIT)throw new ConvexError('Sign in to keep using Cuelo.');
 if(!openingEnabled(process.env))throw new ConvexError('The voice demo is currently paused. Your daily questions have not been used.');
 if(row&&row.activeUntil>now)throw new ConvexError('A question is already being answered in another tab.');
 if(!/^[a-f0-9-]{36}$/.test(args.requestKey))throw new ConvexError('Start a fresh question and try again.');
 const requestKey=`opening-${args.requestKey}`;
 const prior=(await ctx.db.query('spendingReservations').withIndex('by_key',q=>q.eq('key',requestKey)).take(1))[0];if(prior)throw new ConvexError('That question was already submitted.');
 const evaluation=(await ctx.db.query('evaluationUsage').withIndex('by_scope',q=>q.eq('scope','milestone1')).take(1))[0];
 const speech=(await ctx.db.query('speechUsage').withIndex('by_scope',q=>q.eq('scope','mic-evaluation')).take(1))[0];
 if((evaluation?.count??0)>=openingLimit('OPENING_DEMO_MAX_ANSWERS',answerAttemptLimit())||(speech?.count??0)>=openingLimit('OPENING_DEMO_MAX_TRANSCRIPTIONS',10))throw new ConvexError(process.env.CONVEX_CLOUD_URL==='https://calculating-gecko-263.convex.cloud'?WEBSITE_TEST_LIMIT:'The voice demo allowance is used up. Please try again later.');
 if(speech&&speech.activeUntil>now)throw new ConvexError('Busy right now. Try again in a few minutes.');
 const month=spendingMonth(now),ledger=(await ctx.db.query('spendingMonths').withIndex('by_month',q=>q.eq('month',month)).take(1))[0];
 const decision=budgetDecision(ledger?.reservedPaise??0,OPENING_RESERVATION_PAISE,allocationLimit());if(!decision.allowed)throw new ConvexError(BUDGET_EXHAUSTED);
 const values={day,attempts:used+1,activeKey:args.requestKey,activeUntil:now+90000,expiresAt:openingReset(now)+86400000};
 if(row)await ctx.db.patch(row._id,values);else await ctx.db.insert('openingUsage',{ownerKey:key,...values});
 if(evaluation)await ctx.db.patch(evaluation._id,{count:evaluation.count+1,reservedUsd:evaluation.reservedUsd+.2});else await ctx.db.insert('evaluationUsage',{scope:'milestone1',count:1,reservedUsd:.2});
 const speechValues={count:(speech?.count??0)+1,reservedUsd:(speech?.reservedUsd??0)+.01,activeLease:args.requestKey,activeUntil:now+90000};
 if(speech)await ctx.db.patch(speech._id,speechValues);else await ctx.db.insert('speechUsage',{scope:'mic-evaluation',...speechValues});
 const spending={reservedPaise:(ledger?.reservedPaise??0)+OPENING_RESERVATION_PAISE,reservations:(ledger?.reservations??0)+1};
 if(ledger)await ctx.db.patch(ledger._id,spending);else await ctx.db.insert('spendingMonths',{month,...spending});
 await ctx.db.insert('spendingReservations',{key:requestKey,month,purpose:'opening',amountPaise:OPENING_RESERVATION_PAISE});
 return {remaining:OPENING_DAILY_LIMIT-used-1,budgetAlert:decision.alert};
}});
export const release=internalMutation({args:{...args,requestKey:v.string()},returns:v.null(),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.browserSecret);const row=(await ctx.db.query('openingUsage').withIndex('by_owner',q=>q.eq('ownerKey',key)).take(1))[0];
 if(row?.activeKey===args.requestKey)await ctx.db.patch(row._id,{activeKey:null,activeUntil:0});
 const speech=(await ctx.db.query('speechUsage').withIndex('by_scope',q=>q.eq('scope','mic-evaluation')).take(1))[0];
 if(speech?.activeLease===args.requestKey)await ctx.db.patch(speech._id,{activeLease:null,activeUntil:0});return null;
}});
export const cleanup=internalMutation({args:{},returns:v.null(),handler:async ctx=>{for(const row of await ctx.db.query('openingUsage').withIndex('by_expiry',q=>q.lte('expiresAt',Date.now())).take(100))await ctx.db.delete(row._id);return null;}});
