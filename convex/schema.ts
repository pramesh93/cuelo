import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {sourceValue} from "./preparedSourceValues";
import {liveAnswerResult} from './liveAnswerValues';
import {authTables} from "@convex-dev/auth/server";
export default defineSchema({
  ...authTables,
  testerAccess:defineTable({userId:v.id("users"),enabled:v.boolean()}).index("by_user",["userId"]),
  sources: defineTable({ownerKey:v.string(),title:v.string(),kind:v.union(v.literal("text"),v.literal("webpage"),v.literal("pdf"),v.literal("docx")),url:v.union(v.string(),v.null()),pageCount:v.union(v.number(),v.null()),passageCount:v.number(),saved:v.boolean(),expiresAt:v.union(v.number(),v.null())}).index("by_owner",["ownerKey"]).index("by_expiry",["expiresAt"]),
  sourcePassages: defineTable({sourceId:v.id("sources"),ordinal:v.number(),reference:v.string(),text:v.string()}).index("by_source",["sourceId","ordinal"]).searchIndex("search_text",{searchField:"text",filterFields:["sourceId"]}),
  sourceUploads: defineTable({token:v.string(),ownerKey:v.string(),expectedId:v.union(v.id("sources"),v.null()),name:v.string(),size:v.number(),expiresAt:v.number(),state:v.union(v.literal("ready"),v.literal("receiving")),storageId:v.union(v.id("_storage"),v.null())}).index("by_token",["token"]).index("by_expiry",["expiresAt"]),
  sourceAdmission: defineTable({scope:v.literal("sources"),windowStart:v.number(),attempts:v.number()}).index("by_scope",["scope"]),
  liveCallUsage:defineTable({scope:v.literal('pilot'),sessions:v.number()}).index('by_scope',['scope']),
  liveCalls:defineTable({userId:v.id('users'),mode:v.union(v.literal('generic'),v.literal('document')),sourceId:v.union(v.id('sources'),v.null()),sourceOwnerKey:v.union(v.string(),v.null()),state:v.union(v.literal('active'),v.literal('paused')),deadline:v.number(),expiresAt:v.number(),heartbeatAt:v.number(),generation:v.number(),connections:v.number(),sequence:v.number(),customerRevision:v.number(),characters:v.number(),detections:v.number(),answers:v.number(),maxConnections:v.number(),maxDetections:v.number(),maxAnswers:v.number()}).index('by_state',['state']).index('by_user',['userId']).index('by_expiry',['expiresAt']),
  callText:defineTable({sessionId:v.id('liveCalls'),sequence:v.number(),speaker:v.union(v.literal('customer'),v.literal('salesperson')),text:v.string(),revision:v.number(),processed:v.boolean(),question:v.optional(v.string()),questionStatus:v.optional(v.union(v.literal('question'),v.literal('skipped'),v.literal('answered'))),detectionGeneration:v.optional(v.number()),answerGeneration:v.optional(v.number()),answerReserved:v.optional(v.boolean()),answerResult:v.optional(liveAnswerResult)}).index('by_session',['sessionId','sequence']).searchIndex('search_text',{searchField:'text',filterFields:['sessionId']}),
  callSetup: defineTable({
    userId: v.id("users"),
    mode: v.union(v.literal("generic"), v.literal("document")),
    meetingUrl: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  spendingMonths: defineTable({month: v.string(), reservedPaise: v.number(), reservations: v.number()}).index("by_month", ["month"]),
  spendingReservations: defineTable({
    key: v.string(), month: v.string(),
    purpose: v.union(v.literal("opening"), v.literal("practice"), v.literal("live")),
    amountPaise: v.number(),
  }).index("by_key", ["key"]).index("by_month_purpose", ["month", "purpose"]),
  spendingReconciliations: defineTable({month:v.string(),confirmedThrough:v.number(),openAiUsdMicros:v.number(),deepgramUsdMicros:v.number(),retainedPaise:v.number(),beforePaise:v.number(),releasePaise:v.number(),afterPaise:v.number(),reservationIds:v.array(v.id("spendingReservations")),createdAt:v.number()}).index("by_month",["month"]),
  answerVisits: defineTable({ownerKey:v.string(),successful:v.number(),activeKey:v.union(v.string(),v.null()),activeUntil:v.number(),expiresAt:v.number()}).index("by_owner",["ownerKey"]).index("by_expiry",["expiresAt"]),
  answerRequests: defineTable({key:v.string(),ownerKey:v.string(),cancelled:v.boolean(),expiresAt:v.number()}).index("by_key",["key"]).index("by_expiry",["expiresAt"]),
  evaluationUsage: defineTable({ scope: v.literal("milestone1"), count: v.number(), reservedUsd: v.number() }).index("by_scope", ["scope"]),
  speechUsage: defineTable({scope: v.literal("mic-evaluation"), count: v.number(), reservedUsd: v.number(), activeLease: v.union(v.string(), v.null()), activeUntil: v.number()}).index("by_scope", ["scope"]),
  preparedSources:defineTable({secret:v.string(),expiresAt:v.number(),source:v.union(sourceValue,v.null())}).index("by_expiry",["expiresAt"]),
});
