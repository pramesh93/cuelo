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
import type * as answerErrors from "../answerErrors.js";
import type * as answerGeneration from "../answerGeneration.js";
import type * as answerRepair from "../answerRepair.js";
import type * as answerRepairPolicy from "../answerRepairPolicy.js";
import type * as auth from "../auth.js";
import type * as authReturnPolicy from "../authReturnPolicy.js";
import type * as callAccess from "../callAccess.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as developmentTesting from "../developmentTesting.js";
import type * as evaluation from "../evaluation.js";
import type * as evaluationBudget from "../evaluationBudget.js";
import type * as evidence from "../evidence.js";
import type * as freeTrial from "../freeTrial.js";
import type * as http from "../http.js";
import type * as liveAnswerValues from "../liveAnswerValues.js";
import type * as liveAnswers from "../liveAnswers.js";
import type * as liveCallPolicy from "../liveCallPolicy.js";
import type * as liveCalls from "../liveCalls.js";
import type * as liveSpeech from "../liveSpeech.js";
import type * as meetingLink from "../meetingLink.js";
import type * as onboarding from "../onboarding.js";
import type * as openingBudget from "../openingBudget.js";
import type * as openingDemo from "../openingDemo.js";
import type * as openingPolicy from "../openingPolicy.js";
import type * as preparedSourceValues from "../preparedSourceValues.js";
import type * as preparedSources from "../preparedSources.js";
import type * as providerError from "../providerError.js";
import type * as publicAnswerDiagnostics from "../publicAnswerDiagnostics.js";
import type * as publicAnswerGeneration from "../publicAnswerGeneration.js";
import type * as publicAnswerPolicy from "../publicAnswerPolicy.js";
import type * as publicPage from "../publicPage.js";
import type * as selectedAnswerBudget from "../selectedAnswerBudget.js";
import type * as selectedAnswerPolicy from "../selectedAnswerPolicy.js";
import type * as selectedAnswers from "../selectedAnswers.js";
import type * as shortening from "../shortening.js";
import type * as sourceContent from "../sourceContent.js";
import type * as sourceImport from "../sourceImport.js";
import type * as sourceLibrary from "../sourceLibrary.js";
import type * as sourceLibraryStore from "../sourceLibraryStore.js";
import type * as sourceLimits from "../sourceLimits.js";
import type * as sourcePreparation from "../sourcePreparation.js";
import type * as sourceSelectionPolicy from "../sourceSelectionPolicy.js";
import type * as sourceUploadHttp from "../sourceUploadHttp.js";
import type * as sourceUploads from "../sourceUploads.js";
import type * as sourceValues from "../sourceValues.js";
import type * as sources from "../sources.js";
import type * as speech from "../speech.js";
import type * as speechAudio from "../speechAudio.js";
import type * as speechBudget from "../speechBudget.js";
import type * as spending from "../spending.js";
import type * as spendingPolicy from "../spendingPolicy.js";
import type * as spendingReview from "../spendingReview.js";
import type * as testingLimits from "../testingLimits.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountSetup: typeof accountSetup;
  answerErrors: typeof answerErrors;
  answerGeneration: typeof answerGeneration;
  answerRepair: typeof answerRepair;
  answerRepairPolicy: typeof answerRepairPolicy;
  auth: typeof auth;
  authReturnPolicy: typeof authReturnPolicy;
  callAccess: typeof callAccess;
  crons: typeof crons;
  dashboard: typeof dashboard;
  developmentTesting: typeof developmentTesting;
  evaluation: typeof evaluation;
  evaluationBudget: typeof evaluationBudget;
  evidence: typeof evidence;
  freeTrial: typeof freeTrial;
  http: typeof http;
  liveAnswerValues: typeof liveAnswerValues;
  liveAnswers: typeof liveAnswers;
  liveCallPolicy: typeof liveCallPolicy;
  liveCalls: typeof liveCalls;
  liveSpeech: typeof liveSpeech;
  meetingLink: typeof meetingLink;
  onboarding: typeof onboarding;
  openingBudget: typeof openingBudget;
  openingDemo: typeof openingDemo;
  openingPolicy: typeof openingPolicy;
  preparedSourceValues: typeof preparedSourceValues;
  preparedSources: typeof preparedSources;
  providerError: typeof providerError;
  publicAnswerDiagnostics: typeof publicAnswerDiagnostics;
  publicAnswerGeneration: typeof publicAnswerGeneration;
  publicAnswerPolicy: typeof publicAnswerPolicy;
  publicPage: typeof publicPage;
  selectedAnswerBudget: typeof selectedAnswerBudget;
  selectedAnswerPolicy: typeof selectedAnswerPolicy;
  selectedAnswers: typeof selectedAnswers;
  shortening: typeof shortening;
  sourceContent: typeof sourceContent;
  sourceImport: typeof sourceImport;
  sourceLibrary: typeof sourceLibrary;
  sourceLibraryStore: typeof sourceLibraryStore;
  sourceLimits: typeof sourceLimits;
  sourcePreparation: typeof sourcePreparation;
  sourceSelectionPolicy: typeof sourceSelectionPolicy;
  sourceUploadHttp: typeof sourceUploadHttp;
  sourceUploads: typeof sourceUploads;
  sourceValues: typeof sourceValues;
  sources: typeof sources;
  speech: typeof speech;
  speechAudio: typeof speechAudio;
  speechBudget: typeof speechBudget;
  spending: typeof spending;
  spendingPolicy: typeof spendingPolicy;
  spendingReview: typeof spendingReview;
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
