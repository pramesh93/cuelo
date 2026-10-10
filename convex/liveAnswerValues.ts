import {v} from 'convex/values';
import {passageValue,sourceMetaValue} from './sourceValues';
export const liveAnswerResult=v.object({problemCode:v.optional(v.literal('answer_check_failed')),question:v.string(),mode:v.union(v.literal('generic'),v.literal('document')),status:v.union(v.literal('supported'),v.literal('unverified'),v.literal('conflict'),v.literal('generic'),v.literal('error'),v.literal('cancelled')),bullets:v.array(v.string()),message:v.string(),citations:v.array(passageValue),source:v.union(sourceMetaValue,v.null()),elapsedMs:v.number(),budgetAlert:v.boolean()});
