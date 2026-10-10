/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountSetup from "../accountSetup.js";
import type * as answerGeneration from "../answerGeneration.js";
import type * as auth from "../auth.js";
import type * as callAccess from "../callAccess.js";
import type * as crons from "../crons.js";
import type * as evaluation from "../evaluation.js";
import type * as evaluationBudget from "../evaluationBudget.js";
import type * as evidence from "../evidence.js";
import type * as http from "../http.js";
import type * as liveAnswerValues from "../liveAnswerValues.js";
import type * as liveAnswers from "../liveAnswers.js";
import type * as liveCallPolicy from "../liveCallPolicy.js";
import type * as liveCalls from "../liveCalls.js";
import type * as liveSpeech from "../liveSpeech.js";
import type * as meetingLink from "../meetingLink.js";
import type * as preparedSourceValues from "../preparedSourceValues.js";
import type * as preparedSources from "../preparedSources.js";
import type * as providerError from "../providerError.js";
import type * as publicPage from "../publicPage.js";
import type * as selectedAnswerBudget from "../selectedAnswerBudget.js";
import type * as selectedAnswerPolicy from "../selectedAnswerPolicy.js";
import type * as selectedAnswers from "../selectedAnswers.js";
import type * as sourceContent from "../sourceContent.js";
import type * as sourceImport from "../sourceImport.js";
import type * as sourceLimits from "../sourceLimits.js";
import type * as sourcePreparation from "../sourcePreparation.js";
import type * as sourceUploadHttp from "../sourceUploadHttp.js";
import type * as sourceUploads from "../sourceUploads.js";
import type * as sourceValues from "../sourceValues.js";
import type * as sources from "../sources.js";
import type * as speech from "../speech.js";
import type * as speechAudio from "../speechAudio.js";
import type * as speechBudget from "../speechBudget.js";
import type * as spending from "../spending.js";
import type * as spendingPolicy from "../spendingPolicy.js";
import type * as testingLimits from "../testingLimits.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountSetup: typeof accountSetup;
  answerGeneration: typeof answerGeneration;
  auth: typeof auth;
  callAccess: typeof callAccess;
  crons: typeof crons;
  evaluation: typeof evaluation;
  evaluationBudget: typeof evaluationBudget;
  evidence: typeof evidence;
  http: typeof http;
  liveAnswerValues: typeof liveAnswerValues;
  liveAnswers: typeof liveAnswers;
  liveCallPolicy: typeof liveCallPolicy;
  liveCalls: typeof liveCalls;
  liveSpeech: typeof liveSpeech;
  meetingLink: typeof meetingLink;
  preparedSourceValues: typeof preparedSourceValues;
  preparedSources: typeof preparedSources;
  providerError: typeof providerError;
  publicPage: typeof publicPage;
  selectedAnswerBudget: typeof selectedAnswerBudget;
  selectedAnswerPolicy: typeof selectedAnswerPolicy;
  selectedAnswers: typeof selectedAnswers;
  sourceContent: typeof sourceContent;
  sourceImport: typeof sourceImport;
  sourceLimits: typeof sourceLimits;
  sourcePreparation: typeof sourcePreparation;
  sourceUploadHttp: typeof sourceUploadHttp;
  sourceUploads: typeof sourceUploads;
  sourceValues: typeof sourceValues;
  sources: typeof sources;
  speech: typeof speech;
  speechAudio: typeof speechAudio;
  speechBudget: typeof speechBudget;
  spending: typeof spending;
  spendingPolicy: typeof spendingPolicy;
  testingLimits: typeof testingLimits;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
