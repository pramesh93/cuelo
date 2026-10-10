//#region extension/meet/auth-policy.js
function e(e, t) {
	let n;
	try {
		n = new URL(e);
	} catch {
		throw Error("Invalid sign-in address.");
	}
	if (n.origin !== t || n.pathname !== "/api/auth/signin/google" || n.username || n.password || !n.searchParams.get("code")) throw Error("Use Cuelo’s Google sign-in only.");
	return n.href;
}
function t(e, t, n) {
	let r;
	try {
		r = new URL(e);
	} catch {
		return null;
	}
	if (r.origin !== t || r.pathname !== "/" || r.username || r.password || r.searchParams.get("view") !== "extension-auth" || r.searchParams.get("state") !== n) return null;
	let i = r.searchParams.getAll("code");
	if (i.length !== 1 || !i[0] || i[0].length > 2048) throw Error("Google sign-in returned an invalid code.");
	return i[0];
}
//#endregion
//#region extension/meet/auth-config.js
var n = {
	siteOrigin: "https://calculating-gecko-263.convex.site",
	returnOrigin: "http://127.0.0.1:5173"
}, r = null, i = null, a = null, o = 0, s = !1, c = () => chrome.storage.session.get("cueloCallBinding").then((e) => e.cueloCallBinding ?? null), l = () => chrome.storage.session.get("cueloSidebarWindowId").then((e) => e.cueloSidebarWindowId), u = (e) => chrome.storage.session.set({ cueloCallBinding: e }), d = (e) => typeof e?.url == "string" && /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/.test(e.url), f = async (e) => {
	try {
		return (await chrome.tabs.sendMessage(e, { type: "call-state" })).joined === !0;
	} catch {
		return !1;
	}
}, p = async () => (await chrome.runtime.getContexts({
	contextTypes: ["OFFSCREEN_DOCUMENT"],
	documentUrls: [chrome.runtime.getURL("call.html")]
})).length > 0, m = (e) => chrome.runtime.sendMessage({
	...e,
	to: "call"
});
async function ee() {
	await p() || (r ||= chrome.offscreen.createDocument({
		url: "call.html",
		reasons: ["USER_MEDIA"],
		justification: "Keep the authenticated speech connection alive for separate Meet-page audio inputs."
	}).finally(() => {
		r = null;
	}), await r);
}
async function h() {
	if (!await p()) return a ? {
		...a,
		state: "idle",
		busy: !1,
		controlsBusy: !1,
		result: null,
		previousAnswers: []
	} : null;
	try {
		return (await m({ type: "status" })).view ?? null;
	} catch {
		return null;
	}
}
async function g(e) {
	return o++, s = !1, i || (i = (async () => {
		let t = await c();
		t?.nonce && await chrome.tabs.sendMessage(t.tabId, {
			to: "meet-audio",
			type: "stop",
			nonce: t.nonce
		}).catch(() => {}), await p() && (await m({
			type: "stop",
			message: e
		}), await chrome.offscreen.closeDocument());
	})().finally(() => {
		i = null;
	}), i);
}
chrome.action.onClicked.addListener((e) => {
	(async () => {
		await chrome.storage.session.set({ cueloSidebarWindowId: e.windowId });
		let t = await h();
		s || t && t.state !== "idle" || (o++, await u(d(e) ? {
			tabId: e.id,
			windowId: e.windowId
		} : null));
	})().catch(() => {});
});
async function te(e) {
	let t = await h();
	if (await c(), t && t.state !== "idle") return {
		eligible: !0,
		view: t
	};
	let n = (await chrome.tabs.query({
		active: !0,
		windowId: e.tab?.windowId ?? await l() ?? chrome.windows.WINDOW_ID_CURRENT
	}))[0], r = d(n) && await f(n.id);
	return {
		eligible: r,
		setupAvailable: r,
		meeting: r,
		view: t
	};
}
async function ne(e) {
	if (i) throw Error("Cuelo is still stopping.");
	if (s) throw Error("Cuelo is already connecting.");
	s = !0;
	let t = ++o;
	try {
		let n = await h();
		if (!e.resume && n && n.state !== "idle") throw Error("Stop the current Cuelo session first.");
		let r = await c();
		if (!e.resume) {
			let e = (await chrome.tabs.query({
				active: !0,
				windowId: await l() ?? chrome.windows.WINDOW_ID_CURRENT
			}))[0];
			if (!d(e) || !await f(e.id)) throw Error("Join a Meet call before starting Cuelo.");
			r = {
				tabId: e.id,
				windowId: e.windowId
			};
		}
		if (!r || !await f(r.tabId)) throw Error("Join a Meet call before starting Cuelo.");
		let i = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32)), a = Array.from(i, (e) => e.toString(16).padStart(2, "0")).join("");
		if (r = {
			...r,
			nonce: a
		}, await u(r), t !== o) throw Error("Start cancelled.");
		if (!e.resume && await p()) {
			let e = await h();
			if (e && e.state !== "idle") throw Error("Stop the current Cuelo session first.");
			await chrome.offscreen.closeDocument();
		}
		await ee();
		for (let e = 0; e < 100; e++) {
			if (t !== o) throw Error("Start cancelled.");
			if ((await m({ type: "status" }).catch(() => null))?.ready) break;
			if (e === 99) throw Error("Cuelo’s listening page could not get ready. Reload the extension and try again.");
			await new Promise((e) => setTimeout(e, 100));
		}
		if (t !== o || !await f(r.tabId)) throw Error("The meeting ended before Cuelo connected.");
		let s = await m({
			...e,
			type: "start",
			nonce: a
		});
		if (s?.error) throw Error(s.error);
		return s;
	} finally {
		if (t === o) s = !1;
		else if (!s && await p()) {
			let e = await h();
			(!e || e.state === "idle") && await chrome.offscreen.closeDocument();
		}
	}
}
chrome.runtime.onMessage.addListener((e, t, n) => {
	if (e?.to === "call") return;
	let r = t.id === chrome.runtime.id && t.url === chrome.runtime.getURL("auth-check.html"), i = t.id === chrome.runtime.id && t.url === chrome.runtime.getURL("call.html"), o;
	if (i && e.type === "auth-storage" ? o = (async () => {
		if (typeof e.key != "string" || !/^__convexAuth(?:JWT|RefreshToken|OAuthVerifier|ServerStateFetchTime)_cuelosidebarhttps(?:calculatinggecko263|deafeningfrog846)convexcloud$/.test(e.key) || e.key.length > 300) throw Error("Invalid sign-in storage request.");
		if (e.action === "get") {
			let t = await chrome.storage.local.get(e.key);
			return { value: typeof t[e.key] == "string" ? t[e.key] : null };
		}
		if (e.action === "remove") return await chrome.storage.local.remove(e.key), {};
		if (e.action === "set" && typeof e.value == "string" && e.value.length <= 2e4) return await chrome.storage.local.set({ [e.key]: e.value }), {};
		throw Error("Invalid sign-in storage request.");
	})() : i && e.type === "call-view" ? (a = e.view, o = Promise.resolve({})) : i && e.type === "call-alive" ? o = (async () => {
		let e = await c();
		if (!e || !await f(e.tabId)) return await g("Meeting ended. Audio and transcription are off."), {};
		if ((await h())?.state === "listening") {
			let t = await chrome.tabs.sendMessage(e.tabId, {
				to: "meet-audio",
				type: "status",
				nonce: e.nonce
			}).catch(() => null);
			return !t || t.error || t.state !== "listening" ? (await g("Meeting audio disconnected. Cuelo stopped."), {}) : { audio: {
				meetingTracks: t.meetingTracks,
				microphoneState: t.microphoneState
			} };
		}
		return {};
	})() : i && e.type === "meet-audio-control" ? o = (async () => {
		let t = await c();
		if (!t || e.nonce !== t.nonce) throw Error("Old audio connection.");
		if (![
			"prepare",
			"stream",
			"stop",
			"status"
		].includes(e.operation)) throw Error("Unknown audio action.");
		if (e.operation !== "stop" && !await f(t.tabId)) throw Error("The meeting ended.");
		return chrome.tabs.sendMessage(t.tabId, {
			to: "meet-audio",
			type: e.operation,
			nonce: t.nonce,
			...e.operation === "stream" ? { deadline: e.deadline } : {}
		});
	})() : e.type === "meet-audio-frame" || e.type === "meet-audio-ended" ? o = (async () => {
		let n = await c();
		if (t.id !== chrome.runtime.id || t.frameId !== 0 || !d(t.tab) || t.tab?.id !== n?.tabId || e.nonce !== n?.nonce) throw Error("Audio sender is not this meeting.");
		if (e.type === "meet-audio-ended") return await g(typeof e.message == "string" ? e.message.slice(0, 200) : "Meeting audio disconnected. Cuelo stopped."), {};
		if (!["customer", "salesperson"].includes(e.speaker) || typeof e.frame != "string" || e.frame.length !== 2136 || !Number.isSafeInteger(e.sequence) || e.sequence < 1) throw Error("Unreadable meeting audio.");
		return m({
			type: "audio-frame",
			nonce: n.nonce,
			speaker: e.speaker,
			sequence: e.sequence,
			frame: e.frame
		});
	})() : r && e.type === "sidebar-status" ? o = te(t) : r && e.type === "start" ? o = ne(e) : r && e.type === "pause" ? o = (async () => {
		let e = await c();
		return e?.nonce && await chrome.tabs.sendMessage(e.tabId, {
			to: "meet-audio",
			type: "stop",
			nonce: e.nonce
		}).catch(() => {}), m({ type: "pause" });
	})() : r && e.type === "stop" ? o = g("Stopped. Audio and transcription are off.").then(() => ({})) : e.type === "left" && t.id === chrome.runtime.id && d(t.tab) && t.tab?.id && (o = (async () => ((await c())?.tabId === t.tab.id && await g("Meeting ended. Audio and transcription are off."), {}))()), o) return o.then(n).catch((e) => n({ error: e instanceof Error ? e.message : "Cuelo could not finish this action." })), !0;
}), chrome.tabs.onRemoved.addListener((e) => {
	(async () => {
		(await c())?.tabId === e && (await g("Meet tab closed. Audio and transcription are off."), await u(null));
	})().catch(() => {});
});
//#endregion
//#region extension/meet/auth-worker.js
var _ = null;
chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }).catch(() => {}), chrome.action.onClicked.addListener((e) => {
	e.id && chrome.sidePanel.open({ windowId: e.windowId }).catch(() => {});
}), chrome.runtime.onConnect.addListener((t) => {
	if (t.name !== "cuelo-signin" || t.sender?.url !== chrome.runtime.getURL("auth-check.html")) {
		t.disconnect();
		return;
	}
	let r = async (e) => {
		if (_?.port !== t) return;
		let n = _;
		_ = null, clearTimeout(n.timer), Number.isInteger(n.windowId) && await chrome.windows.remove(n.windowId).catch(() => {});
		try {
			t.postMessage(e);
		} catch {}
	};
	t.onMessage.addListener((i) => {
		if (i?.type !== "ping") {
			if (i?.type !== "signin" || _) {
				t.postMessage({ error: "Google sign-in is already open. Finish it or close the window." });
				return;
			}
			(async () => {
				try {
					if (typeof i.nonce != "string" || !/^[a-f0-9]{64}$/.test(i.nonce)) throw Error("Invalid sign-in request.");
					let a = e(i.redirect, n.siteOrigin), o = {
						port: t,
						nonce: i.nonce,
						windowId: null,
						timer: setTimeout(() => {
							r({ error: "Google sign-in timed out. Try again." });
						}, 18e4)
					};
					_ = o;
					let s = await chrome.windows.create({
						url: a,
						type: "popup",
						width: 500,
						height: 700,
						focused: !0
					});
					if (_ !== o) {
						Number.isInteger(s.id) && await chrome.windows.remove(s.id).catch(() => {});
						return;
					}
					if (!Number.isInteger(s.id)) throw Error("Sign-in window did not open.");
					o.windowId = s.id;
					let c = await chrome.tabs.query({ windowId: s.id });
					for (let e of c) re(e.url, e.windowId);
				} catch {
					if (_?.port === t) await r({ error: "Google sign-in could not open. Try again." });
					else try {
						t.postMessage({ error: "Google sign-in could not open safely. Try again." });
					} catch {}
				}
			})();
		}
	}), t.onDisconnect.addListener(() => {
		_?.port === t && r({ error: "Sign-in cancelled because the sidebar closed." });
	});
});
function re(e, r) {
	let i = _;
	if (i && r === i.windowId && e) try {
		let r = t(e, n.returnOrigin, i.nonce);
		if (!r) return;
		_ = null, clearTimeout(i.timer), chrome.windows.remove(i.windowId).catch(() => {}).finally(() => {
			try {
				i.port.postMessage({ code: r });
			} catch {}
		});
	} catch {
		let e = i.port;
		_ = null, clearTimeout(i.timer), chrome.windows.remove(i.windowId).catch(() => {}).finally(() => {
			try {
				e.postMessage({ error: "Google sign-in could not be verified. Try again." });
			} catch {}
		});
	}
}
chrome.tabs.onUpdated.addListener((e, t, n) => re(t.url, n.windowId)), chrome.windows.onRemoved.addListener((e) => {
	let t = _;
	if (t?.windowId === e) {
		_ = null, clearTimeout(t.timer);
		try {
			t.port.postMessage({ error: "Google sign-in was cancelled. You can try again." });
		} catch {}
	}
});
for (var v = "1.46.0", y = [], b = [], ie = Uint8Array, x = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", S = 0, ae = x.length; S < ae; ++S) y[S] = x[S], b[x.charCodeAt(S)] = S;
b[45] = 62, b[95] = 63;
function oe(e) {
	var t = e.length;
	if (t % 4 > 0) throw Error("Invalid string. Length must be a multiple of 4");
	var n = e.indexOf("=");
	n === -1 && (n = t);
	var r = n === t ? 0 : 4 - n % 4;
	return [n, r];
}
function se(e, t, n) {
	return (t + n) * 3 / 4 - n;
}
function C(e) {
	for (var t, n = oe(e), r = n[0], i = n[1], a = new ie(se(e, r, i)), o = 0, s = i > 0 ? r - 4 : r, c = 0; c < s; c += 4) t = b[e.charCodeAt(c)] << 18 | b[e.charCodeAt(c + 1)] << 12 | b[e.charCodeAt(c + 2)] << 6 | b[e.charCodeAt(c + 3)], a[o++] = t >> 16 & 255, a[o++] = t >> 8 & 255, a[o++] = t & 255;
	return i === 2 && (t = b[e.charCodeAt(c)] << 2 | b[e.charCodeAt(c + 1)] >> 4, a[o++] = t & 255), i === 1 && (t = b[e.charCodeAt(c)] << 10 | b[e.charCodeAt(c + 1)] << 4 | b[e.charCodeAt(c + 2)] >> 2, a[o++] = t >> 8 & 255, a[o++] = t & 255), a;
}
function ce(e) {
	return y[e >> 18 & 63] + y[e >> 12 & 63] + y[e >> 6 & 63] + y[e & 63];
}
function le(e, t, n) {
	for (var r, i = [], a = t; a < n; a += 3) r = (e[a] << 16 & 16711680) + (e[a + 1] << 8 & 65280) + (e[a + 2] & 255), i.push(ce(r));
	return i.join("");
}
function w(e) {
	for (var t, n = e.length, r = n % 3, i = [], a = 16383, o = 0, s = n - r; o < s; o += a) i.push(le(e, o, o + a > s ? s : o + a));
	return r === 1 ? (t = e[n - 1], i.push(y[t >> 2] + y[t << 4 & 63] + "==")) : r === 2 && (t = (e[n - 2] << 8) + e[n - 1], i.push(y[t >> 10] + y[t >> 4 & 63] + y[t << 2 & 63] + "=")), i.join("");
}
//#endregion
//#region node_modules/convex/dist/esm/common/index.js
function T(e) {
	if (e === void 0) return {};
	if (!E(e)) throw Error(`The arguments to a Convex function must be an object. Received: ${e}`);
	return e;
}
function ue(e) {
	if (e === void 0) throw Error("Client created with undefined deployment address. If you used an environment variable, check that it's set.");
	if (typeof e != "string") throw Error(`Invalid deployment address: found ${e}".`);
	if (!(e.startsWith("http:") || e.startsWith("https:"))) throw Error(`Invalid deployment address: Must start with "https://" or "http://". Found "${e}".`);
	try {
		new URL(e);
	} catch {
		throw Error(`Invalid deployment address: "${e}" is not a valid URL. If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`);
	}
	if (e.endsWith(".convex.site")) throw Error(`Invalid deployment address: "${e}" ends with .convex.site, which is used for HTTP Actions. Convex deployment URLs typically end with .convex.cloud? If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`);
}
function E(e) {
	let t = typeof e == "object", n = Object.getPrototypeOf(e), r = n === null || n === Object.prototype || n?.constructor?.name === "Object";
	return t && r;
}
//#endregion
//#region node_modules/convex/dist/esm/values/value.js
var de = !0, D = BigInt("-9223372036854775808"), O = BigInt("9223372036854775807"), k = BigInt("0"), fe = BigInt("8"), pe = BigInt("256"), A = "This commit timestamp is unresolved: its value is assigned when the mutation commits. Read the document after the mutation completes to get its value.", j = class {
	[Symbol.toPrimitive](e) {
		if (e === "string") return this.toString();
		throw Error(A);
	}
	valueOf() {
		throw Error(A);
	}
	toJSON() {
		throw Error(A);
	}
	toString() {
		return "[unresolved commit timestamp]";
	}
}, me = new j();
function he(e) {
	return Number.isNaN(e) || !Number.isFinite(e) || Object.is(e, -0);
}
function ge(e) {
	e < k && (e -= D + D);
	let t = e.toString(16);
	t.length % 2 == 1 && (t = "0" + t);
	let n = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(8)), r = 0;
	for (let i of t.match(/.{2}/g).reverse()) n.set([parseInt(i, 16)], r++), e >>= fe;
	return w(n);
}
function _e(e) {
	let t = C(e);
	if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
	let n = k, r = k;
	for (let e of t) n += BigInt(e) * pe ** r, r++;
	return n > O && (n += D + D), n;
}
function ve(e) {
	if (e < D || O < e) throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
	let t = /* @__PURE__ */ new ArrayBuffer(8);
	return new DataView(t).setBigInt64(0, e, !0), w(new Uint8Array(t));
}
function ye(e) {
	let t = C(e);
	if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
	return new DataView(t.buffer).getBigInt64(0, !0);
}
var be = DataView.prototype.setBigInt64 ? ve : ge, xe = DataView.prototype.getBigInt64 ? ye : _e, Se = 1024;
function M(e) {
	if (e.length > Se) throw Error(`Field name ${e} exceeds maximum field name length ${Se}.`);
	if (e.startsWith("$")) throw Error(`Field name ${e} starts with a '$', which is reserved.`);
	for (let t = 0; t < e.length; t += 1) {
		let n = e.charCodeAt(t);
		if (n < 32 || n >= 127) throw Error(`Field name ${e} has invalid character '${e[t]}': Field names can only contain non-control ASCII characters`);
	}
}
function N(e) {
	if (e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string") return e;
	if (Array.isArray(e)) return e.map((e) => N(e));
	if (typeof e != "object") throw Error(`Unexpected type of ${e}`);
	let t = Object.entries(e);
	if (t.length === 1) {
		let n = t[0][0];
		if (n === "$bytes") {
			if (typeof e.$bytes != "string") throw Error(`Malformed $bytes field on ${e}`);
			return C(e.$bytes).buffer;
		}
		if (n === "$integer") {
			if (typeof e.$integer != "string") throw Error(`Malformed $integer field on ${e}`);
			return xe(e.$integer);
		}
		if (n === "$float") {
			if (typeof e.$float != "string") throw Error(`Malformed $float field on ${e}`);
			let t = C(e.$float);
			if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $float`);
			let n = new DataView(t.buffer).getFloat64(0, de);
			if (!he(n)) throw Error(`Float ${n} should be encoded as a number`);
			return n;
		}
		if (n === "$commitTs") {
			if (e.$commitTs !== null) throw Error(`Malformed $commitTs field on ${e}`);
			return me;
		}
		if (n === "$set") throw Error("Received a Set which is no longer supported as a Convex type.");
		if (n === "$map") throw Error("Received a Map which is no longer supported as a Convex type.");
	}
	let n = {};
	for (let [t, r] of Object.entries(e)) M(t), n[t] = N(r);
	return n;
}
var Ce = 16384;
function P(e) {
	let t = JSON.stringify(e, (e, t) => t === void 0 ? "undefined" : typeof t == "bigint" ? `${t.toString()}n` : t);
	if (t.length > Ce) {
		let e = 16370, n = t.codePointAt(e - 1);
		return n !== void 0 && n > 65535 && --e, t.substring(0, e) + "[...truncated]";
	}
	return t;
}
function F(e, t, n, r) {
	if (e === void 0) {
		let e = n && ` (present at path ${n} in original object ${P(t)})`;
		throw Error(`undefined is not a valid Convex value${e}. To learn about Convex's supported types, see https://docs.convex.dev/using/types.`);
	}
	if (e === null) return e;
	if (typeof e == "bigint") {
		if (e < D || O < e) throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
		return { $integer: be(e) };
	}
	if (typeof e == "number") {
		if (he(e)) {
			let t = /* @__PURE__ */ new ArrayBuffer(8);
			return new DataView(t).setFloat64(0, e, de), { $float: w(new Uint8Array(t)) };
		}
		return e;
	}
	if (typeof e == "boolean" || typeof e == "string") return e;
	if (e instanceof ArrayBuffer) return { $bytes: w(new Uint8Array(e)) };
	if (e instanceof j) return { $commitTs: null };
	if (Array.isArray(e)) return e.map((e, r) => F(e, t, n + `[${r}]`, !1));
	if (e instanceof Set) throw Error(I(n, "Set", [...e], t));
	if (e instanceof Map) throw Error(I(n, "Map", [...e], t));
	if (!E(e)) {
		let r = e?.constructor?.name, i = r ? `${r} ` : "";
		throw Error(I(n, i, e, t));
	}
	let i = {}, a = Object.entries(e);
	a.sort(([e, t], [n, r]) => e === n ? 0 : e < n ? -1 : 1);
	for (let [e, o] of a) o === void 0 ? r && (M(e), i[e] = we(o, t, n + `.${e}`)) : (M(e), i[e] = F(o, t, n + `.${e}`, !1));
	return i;
}
function I(e, t, n, r) {
	return e ? `${t}${P(n)} is not a supported Convex type (present at path ${e} in original object ${P(r)}). To learn about Convex's supported types, see https://docs.convex.dev/using/types.` : `${t}${P(n)} is not a supported Convex type.`;
}
function we(e, t, n) {
	if (e === void 0) return { $undefined: null };
	if (t === void 0) throw Error(`Programming error. Current value is ${P(e)} but original value is undefined`);
	return F(e, t, n, !1);
}
function L(e) {
	return F(e, e, "", !1);
}
//#endregion
//#region node_modules/convex/dist/esm/values/errors.js
var Te = Object.defineProperty, Ee = (e, t, n) => t in e ? Te(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, R = (e, t, n) => Ee(e, typeof t == "symbol" ? t : t + "", n), De, Oe, ke = Symbol.for("ConvexError"), z = class extends (Oe = Error, De = ke, Oe) {
	constructor(e) {
		super(typeof e == "string" ? e : P(e)), R(this, "name", "ConvexError"), R(this, "data"), R(this, De, !0), this.data = e;
	}
}, Ae = Object.defineProperty, je = (e, t, n) => t in e ? Ae(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Me = (e, t, n) => je(e, typeof t == "symbol" ? t : t + "", n), Ne = "color:rgb(0, 145, 255)";
function Pe(e) {
	switch (e) {
		case "query": return "Q";
		case "mutation": return "M";
		case "action": return "A";
		case "any": return "?";
	}
}
var Fe = class {
	constructor(e) {
		Me(this, "_onLogLineFuncs"), Me(this, "_verbose"), this._onLogLineFuncs = {}, this._verbose = e.verbose;
	}
	addLogLineListener(e) {
		let t = Math.random().toString(36).substring(2, 15);
		for (let e = 0; e < 10 && this._onLogLineFuncs[t] !== void 0; e++) t = Math.random().toString(36).substring(2, 15);
		return this._onLogLineFuncs[t] = e, () => {
			delete this._onLogLineFuncs[t];
		};
	}
	logVerbose(...e) {
		if (this._verbose) for (let t of Object.values(this._onLogLineFuncs)) t("debug", `${(/* @__PURE__ */ new Date()).toISOString()}`, ...e);
	}
	log(...e) {
		for (let t of Object.values(this._onLogLineFuncs)) t("info", ...e);
	}
	warn(...e) {
		for (let t of Object.values(this._onLogLineFuncs)) t("warn", ...e);
	}
	error(...e) {
		for (let t of Object.values(this._onLogLineFuncs)) t("error", ...e);
	}
};
function Ie(e) {
	let t = new Fe(e);
	return t.addLogLineListener((e, ...t) => {
		switch (e) {
			case "debug":
				console.debug(...t);
				break;
			case "info":
				console.log(...t);
				break;
			case "warn":
				console.warn(...t);
				break;
			case "error":
				console.error(...t);
				break;
			default: console.log(...t);
		}
	}), t;
}
function Le(e) {
	return new Fe(e);
}
function B(e, t, n, r, i) {
	let a = Pe(n);
	if (typeof i == "object" && (i = `ConvexError ${JSON.stringify(i.errorData, null, 2)}`), t === "info") {
		let t = i.match(/^\[.*?\] /);
		if (t === null) {
			e.error(`[CONVEX ${a}(${r})] Could not parse console.log`);
			return;
		}
		let n = i.slice(1, t[0].length - 2), o = i.slice(t[0].length);
		e.log(`%c[CONVEX ${a}(${r})] [${n}]`, Ne, o);
	} else e.error(`[CONVEX ${a}(${r})] ${i}`);
}
//#endregion
//#region node_modules/convex/dist/esm/server/functionName.js
var V = Symbol.for("functionName"), H = Symbol.for("toReferencePath");
function Re(e) {
	return e[H] ?? null;
}
function ze(e) {
	return e.startsWith("function://");
}
function Be(e) {
	let t;
	if (typeof e == "string") t = ze(e) ? { functionHandle: e } : { name: e };
	else if (e[V]) t = { name: e[V] };
	else {
		let n = Re(e);
		if (!n) throw Error(`${e} is not a functionReference`);
		t = { reference: n };
	}
	return t;
}
//#endregion
//#region node_modules/convex/dist/esm/server/api.js
function U(e) {
	let t = Be(e);
	if (t.name === void 0) throw t.functionHandle === void 0 ? t.reference === void 0 ? Error(`Expected function reference like "api.file.func" or "internal.file.func", but received ${JSON.stringify(t)}`) : Error(`Expected function reference in the current component like "api.file.func" or "internal.file.func", but received reference ${t.reference}`) : Error(`Expected function reference like "api.file.func" or "internal.file.func", but received function handle ${t.functionHandle}`);
	if (typeof e == "string") return e;
	let n = e[V];
	if (!n) throw Error(`${e} is not a functionReference`);
	return n;
}
function Ve(e = []) {
	return new Proxy({}, { get(t, n) {
		if (typeof n == "string") return Ve([...e, n]);
		if (n === V) {
			if (e.length < 2) {
				let t = ["api", ...e].join(".");
				throw Error(`API path is expected to be of the form \`api.moduleName.functionName\`. Found: \`${t}\``);
			}
			let t = e.slice(0, -1).join("/"), n = e[e.length - 1];
			return n === "default" ? t : t + ":" + n;
		}
		if (n === Symbol.toStringTag) return "FunctionReference";
	} });
}
var He = Ve(), Ue = Object.defineProperty, We = (e, t, n) => t in e ? Ue(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, W = (e, t, n) => We(e, typeof t == "symbol" ? t : t + "", n), G = void 0, Ge = class {
	constructor(e, t) {
		if (W(this, "address"), W(this, "auth"), W(this, "adminAuth"), W(this, "encodedTsPromise"), W(this, "debug"), W(this, "fetchOptions"), W(this, "fetch"), W(this, "logger"), W(this, "mutationQueue", []), W(this, "isProcessingQueue", !1), typeof t == "boolean") throw Error("skipConvexDeploymentUrlCheck as the second argument is no longer supported. Please pass an options object, `{ skipConvexDeploymentUrlCheck: true }`.");
		(t ?? {}).skipConvexDeploymentUrlCheck !== !0 && ue(e), this.logger = t?.logger === !1 ? Le({ verbose: !1 }) : t?.logger !== !0 && t?.logger ? t.logger : Ie({ verbose: !1 }), this.address = e, this.debug = !0, this.auth = void 0, this.adminAuth = void 0, this.fetch = t?.fetch, t?.auth && this.setAuth(t.auth);
	}
	backendUrl() {
		return `${this.address}/api`;
	}
	get url() {
		return this.address;
	}
	setAuth(e) {
		this.clearAuth(), this.auth = e;
	}
	setAdminAuth(e, t) {
		if (this.clearAuth(), t !== void 0) {
			let n = new TextEncoder().encode(JSON.stringify(t)), r = btoa(String.fromCodePoint(...n));
			this.adminAuth = `${e}:${r}`;
		} else this.adminAuth = e;
	}
	clearAuth() {
		this.auth = void 0, this.adminAuth = void 0;
	}
	setDebug(e) {
		this.debug = e;
	}
	setFetchOptions(e) {
		this.fetchOptions = e;
	}
	async consistentQuery(e, ...t) {
		let n = T(t[0]), r = this.getTimestamp();
		return await this.queryInner(e, n, { timestampPromise: r });
	}
	async getTimestamp() {
		return this.encodedTsPromise ? this.encodedTsPromise : this.encodedTsPromise = this.getTimestampInner();
	}
	async getTimestampInner() {
		let e = this.fetch || G || fetch, t = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${v}`
		}, n = await e(`${this.address}/api/query_ts`, {
			...this.fetchOptions,
			method: "POST",
			headers: t
		});
		if (!n.ok) throw Error(await n.text());
		let { ts: r } = await n.json();
		return r;
	}
	async query(e, ...t) {
		let n = T(t[0]);
		return await this.queryInner(e, n, {});
	}
	async queryInner(e, t, n) {
		let r = U(e), i = [L(t)], a = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${v}`
		};
		this.adminAuth ? a.Authorization = `Convex ${this.adminAuth}` : this.auth && (a.Authorization = `Bearer ${this.auth}`);
		let o = this.fetch || G || fetch, s = n.timestampPromise ? await n.timestampPromise : void 0, c = JSON.stringify({
			path: r,
			format: "convex_encoded_json",
			args: i,
			...s ? { ts: s } : {}
		}), l = await o(s ? `${this.address}/api/query_at_ts` : `${this.address}/api/query`, {
			...this.fetchOptions,
			body: c,
			method: "POST",
			headers: a
		});
		if (!l.ok && l.status !== 560) throw Error(await l.text());
		let u = await l.json();
		if (this.debug) for (let e of u.logLines ?? []) B(this.logger, "info", "query", r, e);
		switch (u.status) {
			case "success": return N(u.value);
			case "error": throw u.errorData === void 0 ? Error(u.errorMessage) : K(u.errorData, new z(u.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(u)}`);
		}
	}
	async mutationInner(e, t) {
		let n = U(e), r = JSON.stringify({
			path: n,
			format: "convex_encoded_json",
			args: [L(t)]
		}), i = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${v}`
		};
		this.adminAuth ? i.Authorization = `Convex ${this.adminAuth}` : this.auth && (i.Authorization = `Bearer ${this.auth}`);
		let a = await (this.fetch || G || fetch)(`${this.address}/api/mutation`, {
			...this.fetchOptions,
			body: r,
			method: "POST",
			headers: i
		});
		if (!a.ok && a.status !== 560) throw Error(await a.text());
		let o = await a.json();
		if (this.debug) for (let e of o.logLines ?? []) B(this.logger, "info", "mutation", n, e);
		switch (o.status) {
			case "success": return N(o.value);
			case "error": throw o.errorData === void 0 ? Error(o.errorMessage) : K(o.errorData, new z(o.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(o)}`);
		}
	}
	async processMutationQueue() {
		if (!this.isProcessingQueue) {
			for (this.isProcessingQueue = !0; this.mutationQueue.length > 0;) {
				let { mutation: e, args: t, resolve: n, reject: r } = this.mutationQueue.shift();
				try {
					n(await this.mutationInner(e, t));
				} catch (e) {
					r(e);
				}
			}
			this.isProcessingQueue = !1;
		}
	}
	enqueueMutation(e, t) {
		return new Promise((n, r) => {
			this.mutationQueue.push({
				mutation: e,
				args: t,
				resolve: n,
				reject: r
			}), this.processMutationQueue();
		});
	}
	async mutation(e, ...t) {
		let [n, r] = t, i = T(n);
		return r?.skipQueue ? await this.mutationInner(e, i) : await this.enqueueMutation(e, i);
	}
	async action(e, ...t) {
		let n = T(t[0]), r = U(e), i = JSON.stringify({
			path: r,
			format: "convex_encoded_json",
			args: [L(n)]
		}), a = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${v}`
		};
		this.adminAuth ? a.Authorization = `Convex ${this.adminAuth}` : this.auth && (a.Authorization = `Bearer ${this.auth}`);
		let o = await (this.fetch || G || fetch)(`${this.address}/api/action`, {
			...this.fetchOptions,
			body: i,
			method: "POST",
			headers: a
		});
		if (!o.ok && o.status !== 560) throw Error(await o.text());
		let s = await o.json();
		if (this.debug) for (let e of s.logLines ?? []) B(this.logger, "info", "action", r, e);
		switch (s.status) {
			case "success": return N(s.value);
			case "error": throw s.errorData === void 0 ? Error(s.errorMessage) : K(s.errorData, new z(s.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(s)}`);
		}
	}
	async function(e, t, ...n) {
		let r = T(n[0]), i = typeof e == "string" ? e : U(e), a = JSON.stringify({
			componentPath: t,
			path: i,
			format: "convex_encoded_json",
			args: L(r)
		}), o = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${v}`
		};
		this.adminAuth ? o.Authorization = `Convex ${this.adminAuth}` : this.auth && (o.Authorization = `Bearer ${this.auth}`);
		let s = await (this.fetch || G || fetch)(`${this.address}/api/function`, {
			...this.fetchOptions,
			body: a,
			method: "POST",
			headers: o
		});
		if (!s.ok && s.status !== 560) throw Error(await s.text());
		let c = await s.json();
		if (this.debug) for (let e of c.logLines ?? []) B(this.logger, "info", "any", i, e);
		switch (c.status) {
			case "success": return N(c.value);
			case "error": throw c.errorData === void 0 ? Error(c.errorMessage) : K(c.errorData, new z(c.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(c)}`);
		}
	}
};
function K(e, t) {
	return t.data = N(e), t;
}
//#endregion
//#region node_modules/convex/dist/esm/server/components/index.js
function q(e, t) {
	return new Proxy({}, { get(n, r) {
		if (typeof r == "string") return q(e, [...t, r]);
		if (r === H) {
			if (t.length < 1) {
				let n = [e, ...t].join(".");
				throw Error(`API path is expected to be of the form \`${e}.childComponent.functionName\`. Found: \`${n}\``);
			}
			return "_reference/childComponent/" + t.join("/");
		}
	} });
}
var Ke = () => q("components", []), J = He;
Ke();
//#endregion
//#region src/auth/sharedSession.ts
var qe = (e) => "cuelo-shared-session:" + e;
function Y(e) {
	try {
		return JSON.parse(atob(e.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub;
	} catch {
		return null;
	}
}
function Je(e, t) {
	return e === t.replace(".convex.cloud", ".convex.site") || t.includes("calculating-gecko-263") && e === "http://127.0.0.1:5173";
}
function Ye(e) {
	let t = Promise.resolve(), n = (e) => ({
		token: e.token,
		revision: e.revision,
		established: e.established
	});
	async function r(t) {
		let r = await e.load();
		if (!r) {
			let t = await e.legacy();
			r = {
				token: t?.token ?? null,
				refreshToken: t?.refreshToken ?? null,
				revision: 0,
				established: !!t
			}, await e.save(r);
		}
		async function i(t, n = !1) {
			Y(r.token) !== Y(t?.token ?? null) && await e.stopCall(), r = {
				token: t?.token ?? null,
				refreshToken: t?.refreshToken ?? null,
				revision: r.revision + 1,
				established: !0,
				...!n && t ? { attempts: r.attempts } : {}
			}, await e.save(r);
		}
		if (t.operation === "state") return { state: n(r) };
		if (t.operation === "import") {
			if (r.established) return { state: n(r) };
			let a = t.tokens;
			if (!a || typeof a.token != "string" || typeof a.refreshToken != "string" || a.token.length > 2e4 || a.refreshToken.length > 2e4) throw Error("Invalid existing sign-in.");
			if (!await e.validate(a.token)) throw Error("Your previous website sign-in expired. Sign in again.");
			let o = await e.call("signIn", { refreshToken: a.refreshToken }, null);
			if (!o.tokens || Y(o.tokens.token)?.split("|")[0] !== Y(a.token)?.split("|")[0]) throw Error("Your previous website sign-in expired. Sign in again.");
			return await i(o.tokens), { state: n(r) };
		}
		if (t.operation === "signOut") {
			let t = r.token;
			await i(null);
			try {
				await e.call("signOut", {}, t);
			} catch {}
			return { state: n(r) };
		}
		if (t.operation === "refresh") return !r.refreshToken || t.token !== r.token || await i((await e.call("signIn", { refreshToken: r.refreshToken }, null)).tokens ?? null), { state: n(r) };
		if (t.operation === "signIn") {
			let a = t.args ?? {};
			if (a.provider !== void 0 && a.provider !== "google") throw Error("Use Google sign-in only.");
			if ("refreshToken" in a || "code" in a) throw Error("Invalid sign-in request.");
			let o = a.params;
			if (a.provider === "google" && o?.code !== void 0) throw Error("Complete only the original sign-in attempt.");
			if (a.provider !== "google" && (typeof o?.code != "string" || typeof a.verifier != "string")) throw Error("Invalid sign-in completion.");
			if (o?.redirectTo !== void 0 && (typeof o.redirectTo != "string" || !o.redirectTo.startsWith("/?view=") || o.redirectTo.startsWith("//"))) throw Error("Invalid sign-in return.");
			if (a.provider !== "google") {
				if (typeof o?.code != "string" || o.code.length > 2048 || typeof a.verifier != "string" || !((r.attempts?.[a.verifier] ?? 0) > Date.now())) throw Error("This sign-in attempt expired or was cancelled.");
				let t = { ...r.attempts };
				delete t[a.verifier], r = {
					...r,
					attempts: t
				}, await e.save(r);
			}
			let s = await e.call("signIn", a, r.token);
			if (s.redirect) {
				if (typeof s.verifier != "string" || s.verifier.length > 2e4) throw Error("Invalid sign-in verifier.");
				let t = Object.fromEntries(Object.entries(r.attempts ?? {}).filter(([, e]) => e > Date.now()).slice(-3));
				t[s.verifier] = Date.now() + 18e4, r = {
					...r,
					attempts: t
				}, await e.save(r);
			}
			return s.tokens !== void 0 && await i(s.tokens, !0), {
				state: n(r),
				...s.redirect ? {
					redirect: s.redirect,
					verifier: s.verifier
				} : {}
			};
		}
		throw Error("Unknown shared sign-in action.");
	}
	return { run(e) {
		let n = t.then(() => r(e));
		return t = n.then(() => {}, () => {}), n;
	} };
}
function Xe(e, t, n) {
	if (e.id !== t) return !1;
	if (e.url === `chrome-extension://${t}/auth-check.html` || e.url === `chrome-extension://${t}/call.html`) return !0;
	try {
		return e.frameId === 0 && Je(new URL(e.url).origin, n);
	} catch {
		return !1;
	}
}
//#endregion
//#region extension/src/sharedAuthWorker.ts
var X = globalThis.chrome, Z = "https://calculating-gecko-263.convex.cloud", Q = qe(Z), $ = ("cuelo-sidebar-" + Z).replace(/[^a-zA-Z0-9]/g, ""), Ze = Ye({
	backend: Z,
	load: async () => (await X.storage.local.get(Q))[Q] ?? null,
	save: async (e) => {
		await X.storage.local.set({ [Q]: e }), e.established && await X.storage.local.remove(["__convexAuthJWT_" + $, "__convexAuthRefreshToken_" + $]);
	},
	legacy: async () => {
		let e = "__convexAuthJWT_" + $, t = "__convexAuthRefreshToken_" + $, n = await X.storage.local.get([e, t]);
		return typeof n[e] == "string" && typeof n[t] == "string" ? {
			token: n[e],
			refreshToken: n[t]
		} : null;
	},
	call: async (e, t, n) => {
		let r = new Ge(Z, { logger: !1 });
		return n && r.setAuth(n), r.action(e === "signIn" ? J.auth.signIn : J.auth.signOut, t);
	},
	validate: async (e) => {
		let t = new Ge(Z, { logger: !1 });
		return t.setAuth(e), t.query(J.auth.isAuthenticated, {});
	},
	stopCall: async () => {
		let e = (await X.storage.session.get("cueloCallBinding")).cueloCallBinding;
		e?.nonce && await X.tabs.sendMessage(e.tabId, {
			to: "meet-audio",
			type: "stop",
			nonce: e.nonce
		}).catch(() => {}), (await X.runtime.getContexts({
			contextTypes: ["OFFSCREEN_DOCUMENT"],
			documentUrls: [X.runtime.getURL("call.html")]
		})).length && (await Promise.race([X.runtime.sendMessage({
			to: "call",
			type: "stop",
			message: "You signed out or changed account. Cuelo stopped."
		}), new Promise((e) => setTimeout(e, 3e3))]).catch(() => {}), await X.offscreen.closeDocument());
	}
});
X.runtime.onMessage.addListener((e, t, n) => {
	if (e?.type !== "shared-auth") return;
	if (!Xe(t, X.runtime.id, Z) || e.backend !== Z) {
		n({ error: "This page cannot access this Cuelo sign-in." });
		return;
	}
	let r = e.request;
	if (JSON.stringify(e).length > 5e4 || !r || ![
		"state",
		"import",
		"signIn",
		"refresh",
		"signOut"
	].includes(r.operation)) {
		n({ error: "Invalid sign-in request." });
		return;
	}
	return Ze.run(r).then(n).catch(() => n({ error: "Cuelo could not update your sign-in. Check your connection and try again." })), !0;
}), X.storage.onChanged.addListener((e, t) => {
	t === "local" && e[Q] && (X.runtime.sendMessage({
		type: "shared-auth-changed",
		backend: Z
	}).catch(() => {}), X.tabs.query({}).then((e) => Promise.allSettled(e.filter((e) => {
		try {
			return Je(new URL(e.url).origin, Z);
		} catch {
			return !1;
		}
	}).map((e) => X.tabs.sendMessage(e.id, {
		type: "shared-auth-changed",
		backend: Z
	})))).catch(() => {}));
});
//#endregion
