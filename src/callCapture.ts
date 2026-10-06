// Local capture controls only. No provider requests, recording or audio storage.
// The live-call owner must enforce backend admission before using this module.
export type CaptureStopReason = "user_stop" | "paused" | "meeting_disconnected" | "microphone_disconnected" | "connection_lost" | "page_left" | "time_limit";
const MAX_CALL_MS = 60 * 60 * 1000;
const WARNING_MS = 5 * 60 * 1000;

type CaptureRuntime = {
  page: EventTarget;
  visibility: EventTarget;
  now: () => number;
  monotonic: () => number;
  setTimer: (callback: () => void, delay: number) => () => void;
};
function browserRuntime(): CaptureRuntime {
  return {page: window, visibility: document, now: () => Date.now(), monotonic: () => performance.now(),
    setTimer: (callback, delay) => {const timer = setTimeout(callback, delay); return () => clearTimeout(timer);}};
}
function release(stream: MediaStream) {stream.getTracks().forEach(track => track.stop());}
function checkMeeting(stream: MediaStream) {
  if (!stream.getAudioTracks().length) throw new Error("No meeting audio connected. Select your Meet tab and enable tab audio.");
  const video = stream.getVideoTracks();
  if (!video.length || video.some(track => track.getSettings().displaySurface !== "browser")) {
    throw new Error("Select the Meet tab, rather than a window or your entire screen.");
  }
  if (stream.getTracks().some(track => track.readyState !== "live")) throw new Error("The meeting audio disconnected. Select your Meet tab again.");
}
function stoppedError() {return new DOMException("Call capture stopped before it could connect.", "AbortError");}

type GuardOptions = {
  meeting: MediaStream;
  microphone: MediaStream;
  // Reuse the original backend deadline on reconnect/resume. Never add an hour.
  deadlineMs: number;
  signal: AbortSignal;
  onStopped: (reason: CaptureStopReason) => void;
  onWarning: () => void;
  runtime?: CaptureRuntime;
};
export type CallCapture = {
  meeting: MediaStream;
  microphone: MediaStream;
  readonly active: boolean;
  stop: (reason?: CaptureStopReason) => void;
};

export function installCallCaptureGuard(options: GuardOptions): CallCapture {
  const runtime = options.runtime ?? browserRuntime();
  try {
    if (!Number.isFinite(options.deadlineMs)) throw new Error("A valid call deadline is required before capture.");
    checkMeeting(options.meeting);
    if (!options.microphone.getAudioTracks().length || options.microphone.getTracks().some(track => track.readyState !== "live")) {
      throw new Error("Your microphone disconnected. Reconnect it before listening.");
    }
    if (options.meeting.getAudioTracks().some(track => options.microphone.getAudioTracks().includes(track))) {
      throw new Error("Meeting audio and your microphone must be separate inputs.");
    }
  } catch (error) {release(options.meeting); release(options.microphone); throw error;}
  let active = true;
  let warned = false;
  let cancelTimer: (() => void) | undefined;
  const listeners: Array<() => void> = [];
  const beganAt = runtime.now(), monotonicStart = runtime.monotonic();
  // A local clock change must not buy more capture time. The server remains
  // authoritative; browser timers can be suspended/throttled or modified.
  const deadline = Math.min(options.deadlineMs, beganAt + MAX_CALL_MS);
  const listen = (target: EventTarget, event: string, handler: () => void) => {
    target.addEventListener(event, handler); listeners.push(() => target.removeEventListener(event, handler));
  };
  function stop(reason: CaptureStopReason = "user_stop") {
    if (!active) return;
    active = false;
    cancelTimer?.();
    listeners.splice(0).forEach(remove => remove());
    // Explicit Stop does not emit an ended event, so release directly.
    release(options.meeting); release(options.microphone);
    options.onStopped(reason);
  }
  function check() {
    if (!active) return;
    cancelTimer?.();
    const now = Math.max(runtime.now(), beganAt + Math.max(0, runtime.monotonic() - monotonicStart));
    const remaining = deadline - now;
    if (remaining <= 0) {stop("time_limit"); return;}
    if (options.meeting.getTracks().some(track => track.readyState !== "live")) {stop("meeting_disconnected"); return;}
    if (options.microphone.getTracks().some(track => track.readyState !== "live")) {stop("microphone_disconnected"); return;}
    if (remaining <= WARNING_MS && !warned) {warned = true; options.onWarning();}
    if (active) cancelTimer = runtime.setTimer(check, Math.min(1000, remaining));
  }
  for (const track of options.meeting.getTracks()) listen(track, "ended", () => stop("meeting_disconnected"));
  for (const track of options.microphone.getTracks()) listen(track, "ended", () => stop("microphone_disconnected"));
  listen(options.signal, "abort", () => stop("user_stop"));
  listen(runtime.page, "pagehide", () => stop("page_left"));
  listen(runtime.page, "offline", () => stop("connection_lost"));
  listen(runtime.page, "pageshow", check);
  // Hidden tabs stay connected. Waking/visibility changes only check expiry.
  listen(runtime.visibility, "visibilitychange", check);
  if (options.signal.aborted) stop("user_stop"); else check();
  return {meeting: options.meeting, microphone: options.microphone, get active() {return active;}, stop};
}

type ConnectionOptions = Omit<GuardOptions, "meeting" | "microphone"> & {
  devices?: Pick<MediaDevices, "getDisplayMedia" | "getUserMedia">;
};
export async function connectCallCapture(options: ConnectionOptions): Promise<CallCapture> {
  const runtime = options.runtime ?? browserRuntime();
  const devices = options.devices ?? navigator.mediaDevices;
  if (!devices?.getDisplayMedia || !devices?.getUserMedia) throw new Error("Live calls need desktop Chrome on a secure page with tab-audio capture.");
  if (!Number.isFinite(options.deadlineMs)) throw new Error("A valid call deadline is required before capture.");
  if (options.signal.aborted) throw stoppedError();
  if (options.deadlineMs <= runtime.now()) throw new Error("This Cuelo session has ended. Start a new session before connecting audio.");
  const streams = new Set<MediaStream>();
  const released = new Set<MediaStream>();
  const listeners: Array<() => void> = [];
  let reason: CaptureStopReason | null = null;
  let handedOff = false;
  const releaseAll = () => {for (const stream of streams) if (!released.has(stream)) {released.add(stream); release(stream);}};
  const pendingStop = (why: CaptureStopReason) => {
    if (reason) return;
    reason = why; releaseAll(); options.onStopped(why);
  };
  const listen = (target: EventTarget, event: string, handler: () => void) => {
    target.addEventListener(event, handler); listeners.push(() => target.removeEventListener(event, handler));
  };
  listen(options.signal, "abort", () => pendingStop("user_stop"));
  listen(runtime.page, "pagehide", () => pendingStop("page_left"));
  listen(runtime.page, "offline", () => pendingStop("connection_lost"));
  const cancelDeadline = runtime.setTimer(() => pendingStop("time_limit"), Math.min(MAX_CALL_MS, options.deadlineMs - runtime.now()));
  try {
    // Call directly from the user's connection click; the picker requires it.
    // Chrome must capture video to select a tab, but no video is sent or saved.
    const meeting = await devices.getDisplayMedia({video: {displaySurface: "browser"}, audio: true});
    streams.add(meeting);
    if (reason || options.signal.aborted) {releaseAll(); throw stoppedError();}
    checkMeeting(meeting);
    for (const track of meeting.getTracks()) listen(track, "ended", () => pendingStop("meeting_disconnected"));
    const microphone = await devices.getUserMedia({audio: {channelCount: 1, echoCancellation: true, noiseSuppression: true}, video: false});
    streams.add(microphone);
    if (reason || options.signal.aborted) {releaseAll(); throw stoppedError();}
    // Transfer ownership synchronously; no gap where Stop loses both streams.
    listeners.splice(0).forEach(remove => remove()); cancelDeadline();
    const guard = installCallCaptureGuard({...options, meeting, microphone, runtime});
    if (!guard.active) throw stoppedError();
    handedOff = true;
    return guard;
  } finally {
    listeners.splice(0).forEach(remove => remove()); cancelDeadline();
    if (!handedOff) releaseAll();
  }
}
