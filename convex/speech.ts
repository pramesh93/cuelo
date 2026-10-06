"use node";
import {randomUUID} from "node:crypto";
import {action} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {validateQuestionAudio} from "./speechAudio";

export const transcribe = action({
  args:{audio:v.bytes()},
  returns:v.object({status:v.union(v.literal("ok"),v.literal("error")), transcript:v.union(v.string(),v.null()), message:v.string(), elapsedMs:v.number()}),
  handler: async (ctx,args) => {
    const started = Date.now();
    const error = (message:string) => ({status:"error" as const,transcript:null,message,elapsedMs:Date.now()-started});
    try {validateQuestionAudio(args.audio);} catch (cause) {
      return error(cause instanceof Error ? cause.message : "The microphone audio could not be read. Try again.");
    }
    if (!process.env.DEEPGRAM_API_KEY || process.env.SPEECH_TESTING_ENABLED !== "true") {
      return error("Speech testing is not enabled yet. Add the Deepgram key and enable speech testing in Convex.");
    }
    const lease = randomUUID();
    const admission = await ctx.runMutation(internal.speechBudget.reserve,{lease});
    if (admission === "exhausted") return error("The speech testing allowance is used up. Paid requests have stopped.");
    if (admission === "answers_exhausted") return error("The answer testing allowance is used up. Paid requests have stopped.");
    if (admission === "disabled") return error("Speech or answer testing is not enabled. Check the Convex settings.");
    if (admission === "busy") return error("Another question is being transcribed. Try again shortly.");
    try {
      const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&mip_opt_out=true", {
        method:"POST", headers:{Authorization:`Token ${process.env.DEEPGRAM_API_KEY}`,"Content-Type":"audio/wav"},
        body:args.audio, signal:AbortSignal.timeout(25000),
      });
      if (!response.ok) {
        // Never log the provider body: it may contain audio or transcript details.
        console.error("Cuelo speech request failed",{step:"deepgram_transcription",status:response.status});
        if (response.status === 401 || response.status === 403) return error("Deepgram could not authorise speech recognition. Check the key and its permissions in Convex.");
        if (response.status === 402) return error("Deepgram credits are unavailable. Check the Deepgram account before trying again.");
        if (response.status === 400 || response.status === 415) return error("Deepgram could not read the microphone audio. Try speaking again.");
        return error("Busy right now. Try again in a few minutes.");
      }
      const data = await response.json();
      const alternative = data?.results?.channels?.[0]?.alternatives?.[0];
      const transcript = typeof alternative?.transcript === "string" ? alternative.transcript.trim() : "";
      if (!transcript || typeof alternative?.confidence !== "number" || alternative.confidence < 0.5) {
        return error("I couldn’t hear a clear question. Try again closer to your microphone, or type it below.");
      }
      if (transcript.length > 1000) return error("That question is too long. Ask a shorter question; nothing was sent for an answer.");
      return {status:"ok" as const,transcript,message:"",elapsedMs:Date.now()-started};
    } catch {
      return error("Speech recognition could not connect or took too long. Try again, or type your question below.");
    } finally {
      await ctx.runMutation(internal.speechBudget.release,{lease});
    }
  },
});
