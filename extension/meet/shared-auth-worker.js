//#region src/auth/sharedSession.ts
var e = (e) => "cuelo-shared-session:" + e;
function t(e) {
	try {
		return JSON.parse(atob(e.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub;
	} catch {
		return null;
	}
}
function n(e, t) {
	return e === t.replace(".convex.cloud", ".convex.site") || t.includes("calculating-gecko-263") && e === "http://127.0.0.1:5173";
}
function r(e) {
	let n = Promise.resolve(), r = (e) => ({
		token: e.token,
		revision: e.revision,
		established: e.established
	});
	async function i(n) {
		let i = await e.load();
		if (!i) {
			let t = await e.legacy();
			i = {
				token: t?.token ?? null,
				refreshToken: t?.refreshToken ?? null,
				revision: 0,
				established: !!t
			}, await e.save(i);
		}
		async function a(n, r = !1) {
			t(i.token) !== t(n?.token ?? null) && await e.stopCall(), i = {
				token: n?.token ?? null,
				refreshToken: n?.refreshToken ?? null,
				revision: i.revision + 1,
				established: !0,
				...!r && n ? { attempts: i.attempts } : {}
			}, await e.save(i);
		}
		if (n.operation === "state") return { state: r(i) };
		if (n.operation === "import") {
			if (i.established) return { state: r(i) };
			let o = n.tokens;
			if (!o || typeof o.token != "string" || typeof o.refreshToken != "string" || o.token.length > 2e4 || o.refreshToken.length > 2e4) throw Error("Invalid existing sign-in.");
			if (!await e.validate(o.token)) throw Error("Your previous website sign-in expired. Sign in again.");
			let s = await e.call("signIn", { refreshToken: o.refreshToken }, null);
			if (!s.tokens || t(s.tokens.token)?.split("|")[0] !== t(o.token)?.split("|")[0]) throw Error("Your previous website sign-in expired. Sign in again.");
			return await a(s.tokens), { state: r(i) };
		}
		if (n.operation === "signOut") {
			let t = i.token;
			await a(null);
			try {
				await e.call("signOut", {}, t);
			} catch {}
			return { state: r(i) };
		}
		if (n.operation === "refresh") return !i.refreshToken || n.token !== i.token || await a((await e.call("signIn", { refreshToken: i.refreshToken }, null)).tokens ?? null), { state: r(i) };
		if (n.operation === "signIn") {
			let t = n.args ?? {};
			if (t.provider !== void 0 && t.provider !== "google") throw Error("Use Google sign-in only.");
			if ("refreshToken" in t || "code" in t) throw Error("Invalid sign-in request.");
			let o = t.params;
			if (t.provider === "google" && o?.code !== void 0) throw Error("Complete only the original sign-in attempt.");
			if (t.provider !== "google" && (typeof o?.code != "string" || typeof t.verifier != "string")) throw Error("Invalid sign-in completion.");
			if (o?.redirectTo !== void 0 && (typeof o.redirectTo != "string" || !o.redirectTo.startsWith("/?view=") || o.redirectTo.startsWith("//"))) throw Error("Invalid sign-in return.");
			if (t.provider !== "google") {
				if (typeof o?.code != "string" || o.code.length > 2048 || typeof t.verifier != "string" || !((i.attempts?.[t.verifier] ?? 0) > Date.now())) throw Error("This sign-in attempt expired or was cancelled.");
				let n = { ...i.attempts };
				delete n[t.verifier], i = {
					...i,
					attempts: n
				}, await e.save(i);
			}
			let s = await e.call("signIn", t, i.token);
			if (s.redirect) {
				if (typeof s.verifier != "string" || s.verifier.length > 2e4) throw Error("Invalid sign-in verifier.");
				let t = Object.fromEntries(Object.entries(i.attempts ?? {}).filter(([, e]) => e > Date.now()).slice(-3));
				t[s.verifier] = Date.now() + 18e4, i = {
					...i,
					attempts: t
				}, await e.save(i);
			}
			return s.tokens !== void 0 && await a(s.tokens, !0), {
				state: r(i),
				...s.redirect ? {
					redirect: s.redirect,
					verifier: s.verifier
				} : {}
			};
		}
		throw Error("Unknown shared sign-in action.");
	}
	return { run(e) {
		let t = n.then(() => i(e));
		return n = t.then(() => {}, () => {}), t;
	} };
}
function i(e, t, r) {
	if (e.id !== t) return !1;
	if (e.url === `chrome-extension://${t}/auth-check.html` || e.url === `chrome-extension://${t}/call.html`) return !0;
	try {
		return e.frameId === 0 && n(new URL(e.url).origin, r);
	} catch {
		return !1;
	}
}
//#endregion
//#region extension/src/connectOpenWebsites.ts
async function a(e, t) {
	let r = await e.tabs.query({});
	await Promise.allSettled(r.filter((e) => {
		try {
			return Number.isInteger(e.id) && n(new URL(e.url).origin, t);
		} catch {
			return !1;
		}
	}).map((t) => e.scripting.executeScript({
		target: { tabId: t.id },
		files: ["website-auth-bridge.js"]
	})));
}
//#endregion
//#region extension/meet/auth-policy.js
function o(e, t) {
	let n;
	try {
		n = new URL(e);
	} catch {
		throw Error("Invalid sign-in address.");
	}
	if (n.origin !== t || n.pathname !== "/api/auth/signin/google" || n.username || n.password || !n.searchParams.get("code")) throw Error("Use Cuelo’s Google sign-in only.");
	return n.href;
}
function s(e, t, n) {
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
//#region \0cuelo-auth-config
var c = {
	siteOrigin: "https://calculating-gecko-263.convex.site",
	returnOrigin: "http://127.0.0.1:5173"
}, l = null, u = null, d = null, f = 0, p = !1, m = () => chrome.storage.session.get("cueloCallBinding").then((e) => e.cueloCallBinding ?? null), ee = () => chrome.storage.session.get("cueloSidebarWindowId").then((e) => e.cueloSidebarWindowId), h = (e) => chrome.storage.session.set({ cueloCallBinding: e }), g = (e) => typeof e?.url == "string" && /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/.test(e.url), _ = async (e) => {
	try {
		return (await chrome.tabs.sendMessage(e, { type: "call-state" })).joined === !0;
	} catch {
		return !1;
	}
}, v = async () => (await chrome.runtime.getContexts({
	contextTypes: ["OFFSCREEN_DOCUMENT"],
	documentUrls: [chrome.runtime.getURL("call.html")]
})).length > 0, y = (e) => chrome.runtime.sendMessage({
	...e,
	to: "call"
});
async function te() {
	await v() || (l ||= chrome.offscreen.createDocument({
		url: "call.html",
		reasons: ["USER_MEDIA"],
		justification: "Keep the authenticated speech connection alive for separate Meet-page audio inputs."
	}).finally(() => {
		l = null;
	}), await l);
}
async function b() {
	if (!await v()) return d ? {
		...d,
		state: "idle",
		busy: !1,
		controlsBusy: !1,
		result: null,
		previousAnswers: []
	} : null;
	try {
		return (await y({ type: "status" })).view ?? null;
	} catch {
		return null;
	}
}
async function x(e) {
	return f++, p = !1, u || (u = (async () => {
		let t = await m();
		t?.nonce && await chrome.tabs.sendMessage(t.tabId, {
			to: "meet-audio",
			type: "stop",
			nonce: t.nonce
		}).catch(() => {}), await v() && (await y({
			type: "stop",
			message: e
		}), await chrome.offscreen.closeDocument());
	})().finally(() => {
		u = null;
	}), u);
}
chrome.action.onClicked.addListener((e) => {
	(async () => {
		await chrome.storage.session.set({ cueloSidebarWindowId: e.windowId });
		let t = await b();
		p || t && t.state !== "idle" || (f++, await h(g(e) ? {
			tabId: e.id,
			windowId: e.windowId
		} : null));
	})().catch(() => {});
});
async function ne(e) {
	let t = await b();
	if (await m(), t && t.state !== "idle") return {
		eligible: !0,
		view: t
	};
	let n = (await chrome.tabs.query({
		active: !0,
		windowId: e.tab?.windowId ?? await ee() ?? chrome.windows.WINDOW_ID_CURRENT
	}))[0], r = g(n) && await _(n.id);
	return {
		eligible: r,
		setupAvailable: r,
		meeting: r,
		view: t
	};
}
async function re(e) {
	if (u) throw Error("Cuelo is still stopping.");
	if (p) throw Error("Cuelo is already connecting.");
	p = !0;
	let t = ++f;
	try {
		let n = await b();
		if (!e.resume && n && n.state !== "idle") throw Error("Stop the current Cuelo session first.");
		let r = await m();
		if (!e.resume) {
			let e = (await chrome.tabs.query({
				active: !0,
				windowId: await ee() ?? chrome.windows.WINDOW_ID_CURRENT
			}))[0];
			if (!g(e) || !await _(e.id)) throw Error("Join a Meet call before starting Cuelo.");
			r = {
				tabId: e.id,
				windowId: e.windowId
			};
		}
		if (!r || !await _(r.tabId)) throw Error("Join a Meet call before starting Cuelo.");
		let i = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32)), a = Array.from(i, (e) => e.toString(16).padStart(2, "0")).join("");
		if (r = {
			...r,
			nonce: a
		}, await h(r), t !== f) throw Error("Start cancelled.");
		if (!e.resume && await v()) {
			let e = await b();
			if (e && e.state !== "idle") throw Error("Stop the current Cuelo session first.");
			await chrome.offscreen.closeDocument();
		}
		await te();
		for (let e = 0; e < 100; e++) {
			if (t !== f) throw Error("Start cancelled.");
			if ((await y({ type: "status" }).catch(() => null))?.ready) break;
			if (e === 99) throw Error("Cuelo’s listening page could not get ready. Reload the extension and try again.");
			await new Promise((e) => setTimeout(e, 100));
		}
		if (t !== f || !await _(r.tabId)) throw Error("The meeting ended before Cuelo connected.");
		let o;
		try {
			o = await chrome.tabCapture.getMediaStreamId({ targetTabId: r.tabId });
		} catch {
			throw Error("Open the Meet tab and click the Cuelo extension icon, then try Start or Resume again. Chrome needs that click to allow meeting audio.");
		}
		if (t !== f) throw Error("Start cancelled.");
		let s = await y({
			...e,
			type: "start",
			nonce: a,
			streamId: o
		});
		if (s?.error) throw Error(s.error);
		return s;
	} finally {
		if (t === f) p = !1;
		else if (!p && await v()) {
			let e = await b();
			(!e || e.state === "idle") && await chrome.offscreen.closeDocument();
		}
	}
}
chrome.runtime.onMessage.addListener((e, t, n) => {
	if (e?.to === "call") return;
	let r = t.id === chrome.runtime.id && t.url === chrome.runtime.getURL("auth-check.html"), i = t.id === chrome.runtime.id && t.url === chrome.runtime.getURL("call.html"), a;
	if (i && e.type === "auth-storage" ? a = (async () => {
		if (typeof e.key != "string" || !/^__convexAuth(?:JWT|RefreshToken|OAuthVerifier|ServerStateFetchTime)_cuelosidebarhttps(?:calculatinggecko263|deafeningfrog846)convexcloud$/.test(e.key) || e.key.length > 300) throw Error("Invalid sign-in storage request.");
		if (e.action === "get") {
			let t = await chrome.storage.local.get(e.key);
			return { value: typeof t[e.key] == "string" ? t[e.key] : null };
		}
		if (e.action === "remove") return await chrome.storage.local.remove(e.key), {};
		if (e.action === "set" && typeof e.value == "string" && e.value.length <= 2e4) return await chrome.storage.local.set({ [e.key]: e.value }), {};
		throw Error("Invalid sign-in storage request.");
	})() : i && e.type === "call-view" ? (d = e.view, a = Promise.resolve({})) : i && e.type === "call-alive" ? a = (async () => {
		let e = await m();
		if (!e || !await _(e.tabId)) return await x("Meeting ended. Audio and transcription are off."), {};
		if ((await b())?.state === "listening") {
			let t = await chrome.tabs.sendMessage(e.tabId, {
				to: "meet-audio",
				type: "status",
				nonce: e.nonce
			}).catch(() => null);
			return !t || t.error || t.state !== "listening" ? (await x("Meeting audio disconnected. Cuelo stopped."), {}) : { audio: {
				microphoneLevel: t.microphoneLevel,
				microphoneState: t.microphoneState
			} };
		}
		return {};
	})() : i && e.type === "meet-audio-control" ? a = (async () => {
		let t = await m();
		if (!t || e.nonce !== t.nonce) throw Error("Old audio connection.");
		if (![
			"prepare",
			"stream",
			"stop",
			"status"
		].includes(e.operation)) throw Error("Unknown audio action.");
		if (e.operation !== "stop" && !await _(t.tabId)) throw Error("The meeting ended.");
		return chrome.tabs.sendMessage(t.tabId, {
			to: "meet-audio",
			type: e.operation,
			nonce: t.nonce,
			...e.operation === "stream" ? { deadline: e.deadline } : {}
		});
	})() : e.type === "meet-audio-frame" || e.type === "meet-audio-ended" ? a = (async () => {
		let n = await m();
		if (t.id !== chrome.runtime.id || t.frameId !== 0 || !g(t.tab) || t.tab?.id !== n?.tabId || e.nonce !== n?.nonce) throw Error("Audio sender is not this meeting.");
		if (e.type === "meet-audio-ended") return await x(typeof e.message == "string" ? e.message.slice(0, 200) : "Meeting audio disconnected. Cuelo stopped."), {};
		if (!["customer", "salesperson"].includes(e.speaker) || typeof e.frame != "string" || e.frame.length !== 2136 || !Number.isSafeInteger(e.sequence) || e.sequence < 1) throw Error("Unreadable meeting audio.");
		return y({
			type: "audio-frame",
			nonce: n.nonce,
			speaker: e.speaker,
			sequence: e.sequence,
			frame: e.frame
		});
	})() : r && e.type === "sidebar-status" ? a = ne(t) : r && e.type === "start" ? a = re(e) : r && e.type === "typed-question" ? a = (async () => {
		if (typeof e.text != "string" || !e.text.trim() || e.text.trim().length > 1e3) throw Error("Type a question using 1 to 1,000 characters.");
		let t = await m();
		if (!t || !await _(t.tabId) || !await v()) throw Error("Join a Meet call and start Cuelo before typing a question.");
		return y({
			type: "typed-question",
			text: e.text.trim()
		});
	})() : r && e.type === "pause" ? a = (async () => {
		let e = await m();
		return e?.nonce && await chrome.tabs.sendMessage(e.tabId, {
			to: "meet-audio",
			type: "stop",
			nonce: e.nonce
		}).catch(() => {}), y({ type: "pause" });
	})() : r && e.type === "stop" ? a = x("Stopped. Audio and transcription are off.").then(() => ({})) : e.type === "left" && t.id === chrome.runtime.id && g(t.tab) && t.tab?.id && (a = (async () => ((await m())?.tabId === t.tab.id && await x("Meeting ended. Audio and transcription are off."), {}))()), a) return a.then(n).catch((e) => n({ error: e instanceof Error ? e.message : "Cuelo could not finish this action." })), !0;
}), chrome.tabs.onRemoved.addListener((e) => {
	(async () => {
		(await m())?.tabId === e && (await x("Meet tab closed. Audio and transcription are off."), await h(null));
	})().catch(() => {});
});
//#endregion
//#region extension/meet/auth-worker.js
var S = null;
chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }).catch(() => {}), chrome.action.onClicked.addListener((e) => {
	e.id && chrome.sidePanel.open({ windowId: e.windowId }).catch(() => {});
}), chrome.runtime.onConnect.addListener((e) => {
	if (e.name !== "cuelo-signin" || e.sender?.url !== chrome.runtime.getURL("auth-check.html")) {
		e.disconnect();
		return;
	}
	let t = async (t) => {
		if (S?.port !== e) return;
		let n = S;
		S = null, clearTimeout(n.timer), Number.isInteger(n.windowId) && await chrome.windows.remove(n.windowId).catch(() => {});
		try {
			e.postMessage(t);
		} catch {}
	};
	e.onMessage.addListener((n) => {
		if (n?.type !== "ping") {
			if (n?.type !== "signin" || S) {
				e.postMessage({ error: "Google sign-in is already open. Finish it or close the window." });
				return;
			}
			(async () => {
				try {
					if (typeof n.nonce != "string" || !/^[a-f0-9]{64}$/.test(n.nonce)) throw Error("Invalid sign-in request.");
					let r = o(n.redirect, c.siteOrigin), i = {
						port: e,
						nonce: n.nonce,
						windowId: null,
						timer: setTimeout(() => {
							t({ error: "Google sign-in timed out. Try again." });
						}, 18e4)
					};
					S = i;
					let a = await chrome.windows.create({
						url: r,
						type: "popup",
						width: 500,
						height: 700,
						focused: !0
					});
					if (S !== i) {
						Number.isInteger(a.id) && await chrome.windows.remove(a.id).catch(() => {});
						return;
					}
					if (!Number.isInteger(a.id)) throw Error("Sign-in window did not open.");
					i.windowId = a.id;
					let s = await chrome.tabs.query({ windowId: a.id });
					for (let e of s) ie(e.url, e.windowId);
				} catch {
					if (S?.port === e) await t({ error: "Google sign-in could not open. Try again." });
					else try {
						e.postMessage({ error: "Google sign-in could not open safely. Try again." });
					} catch {}
				}
			})();
		}
	}), e.onDisconnect.addListener(() => {
		S?.port === e && t({ error: "Sign-in cancelled because the sidebar closed." });
	});
});
function ie(e, t) {
	let n = S;
	if (n && t === n.windowId && e) try {
		let t = s(e, c.returnOrigin, n.nonce);
		if (!t) return;
		S = null, clearTimeout(n.timer), chrome.windows.remove(n.windowId).catch(() => {}).finally(() => {
			try {
				n.port.postMessage({ code: t });
			} catch {}
		});
	} catch {
		let e = n.port;
		S = null, clearTimeout(n.timer), chrome.windows.remove(n.windowId).catch(() => {}).finally(() => {
			try {
				e.postMessage({ error: "Google sign-in could not be verified. Try again." });
			} catch {}
		});
	}
}
chrome.tabs.onUpdated.addListener((e, t, n) => ie(t.url, n.windowId)), chrome.windows.onRemoved.addListener((e) => {
	let t = S;
	if (t?.windowId === e) {
		S = null, clearTimeout(t.timer);
		try {
			t.port.postMessage({ error: "Google sign-in was cancelled. You can try again." });
		} catch {}
	}
});
for (var C = "1.46.0", w = [], T = [], ae = Uint8Array, E = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", D = 0, oe = E.length; D < oe; ++D) w[D] = E[D], T[E.charCodeAt(D)] = D;
T[45] = 62, T[95] = 63;
function se(e) {
	var t = e.length;
	if (t % 4 > 0) throw Error("Invalid string. Length must be a multiple of 4");
	var n = e.indexOf("=");
	n === -1 && (n = t);
	var r = n === t ? 0 : 4 - n % 4;
	return [n, r];
}
function ce(e, t, n) {
	return (t + n) * 3 / 4 - n;
}
function O(e) {
	for (var t, n = se(e), r = n[0], i = n[1], a = new ae(ce(e, r, i)), o = 0, s = i > 0 ? r - 4 : r, c = 0; c < s; c += 4) t = T[e.charCodeAt(c)] << 18 | T[e.charCodeAt(c + 1)] << 12 | T[e.charCodeAt(c + 2)] << 6 | T[e.charCodeAt(c + 3)], a[o++] = t >> 16 & 255, a[o++] = t >> 8 & 255, a[o++] = t & 255;
	return i === 2 && (t = T[e.charCodeAt(c)] << 2 | T[e.charCodeAt(c + 1)] >> 4, a[o++] = t & 255), i === 1 && (t = T[e.charCodeAt(c)] << 10 | T[e.charCodeAt(c + 1)] << 4 | T[e.charCodeAt(c + 2)] >> 2, a[o++] = t >> 8 & 255, a[o++] = t & 255), a;
}
function le(e) {
	return w[e >> 18 & 63] + w[e >> 12 & 63] + w[e >> 6 & 63] + w[e & 63];
}
function ue(e, t, n) {
	for (var r, i = [], a = t; a < n; a += 3) r = (e[a] << 16 & 16711680) + (e[a + 1] << 8 & 65280) + (e[a + 2] & 255), i.push(le(r));
	return i.join("");
}
function k(e) {
	for (var t, n = e.length, r = n % 3, i = [], a = 16383, o = 0, s = n - r; o < s; o += a) i.push(ue(e, o, o + a > s ? s : o + a));
	return r === 1 ? (t = e[n - 1], i.push(w[t >> 2] + w[t << 4 & 63] + "==")) : r === 2 && (t = (e[n - 2] << 8) + e[n - 1], i.push(w[t >> 10] + w[t >> 4 & 63] + w[t << 2 & 63] + "=")), i.join("");
}
//#endregion
//#region node_modules/convex/dist/esm/common/index.js
function A(e) {
	if (e === void 0) return {};
	if (!fe(e)) throw Error(`The arguments to a Convex function must be an object. Received: ${e}`);
	return e;
}
function de(e) {
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
function fe(e) {
	let t = typeof e == "object", n = Object.getPrototypeOf(e), r = n === null || n === Object.prototype || n?.constructor?.name === "Object";
	return t && r;
}
//#endregion
//#region node_modules/convex/dist/esm/values/value.js
var pe = !0, j = BigInt("-9223372036854775808"), M = BigInt("9223372036854775807"), N = BigInt("0"), me = BigInt("8"), he = BigInt("256"), P = "This commit timestamp is unresolved: its value is assigned when the mutation commits. Read the document after the mutation completes to get its value.", ge = class {
	[Symbol.toPrimitive](e) {
		if (e === "string") return this.toString();
		throw Error(P);
	}
	valueOf() {
		throw Error(P);
	}
	toJSON() {
		throw Error(P);
	}
	toString() {
		return "[unresolved commit timestamp]";
	}
}, _e = new ge();
function ve(e) {
	return Number.isNaN(e) || !Number.isFinite(e) || Object.is(e, -0);
}
function ye(e) {
	e < N && (e -= j + j);
	let t = e.toString(16);
	t.length % 2 == 1 && (t = "0" + t);
	let n = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(8)), r = 0;
	for (let i of t.match(/.{2}/g).reverse()) n.set([parseInt(i, 16)], r++), e >>= me;
	return k(n);
}
function be(e) {
	let t = O(e);
	if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
	let n = N, r = N;
	for (let e of t) n += BigInt(e) * he ** r, r++;
	return n > M && (n += j + j), n;
}
function xe(e) {
	if (e < j || M < e) throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
	let t = /* @__PURE__ */ new ArrayBuffer(8);
	return new DataView(t).setBigInt64(0, e, !0), k(new Uint8Array(t));
}
function Se(e) {
	let t = O(e);
	if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
	return new DataView(t.buffer).getBigInt64(0, !0);
}
var Ce = DataView.prototype.setBigInt64 ? xe : ye, we = DataView.prototype.getBigInt64 ? Se : be, Te = 1024;
function F(e) {
	if (e.length > Te) throw Error(`Field name ${e} exceeds maximum field name length ${Te}.`);
	if (e.startsWith("$")) throw Error(`Field name ${e} starts with a '$', which is reserved.`);
	for (let t = 0; t < e.length; t += 1) {
		let n = e.charCodeAt(t);
		if (n < 32 || n >= 127) throw Error(`Field name ${e} has invalid character '${e[t]}': Field names can only contain non-control ASCII characters`);
	}
}
function I(e) {
	if (e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string") return e;
	if (Array.isArray(e)) return e.map((e) => I(e));
	if (typeof e != "object") throw Error(`Unexpected type of ${e}`);
	let t = Object.entries(e);
	if (t.length === 1) {
		let n = t[0][0];
		if (n === "$bytes") {
			if (typeof e.$bytes != "string") throw Error(`Malformed $bytes field on ${e}`);
			return O(e.$bytes).buffer;
		}
		if (n === "$integer") {
			if (typeof e.$integer != "string") throw Error(`Malformed $integer field on ${e}`);
			return we(e.$integer);
		}
		if (n === "$float") {
			if (typeof e.$float != "string") throw Error(`Malformed $float field on ${e}`);
			let t = O(e.$float);
			if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $float`);
			let n = new DataView(t.buffer).getFloat64(0, pe);
			if (!ve(n)) throw Error(`Float ${n} should be encoded as a number`);
			return n;
		}
		if (n === "$commitTs") {
			if (e.$commitTs !== null) throw Error(`Malformed $commitTs field on ${e}`);
			return _e;
		}
		if (n === "$set") throw Error("Received a Set which is no longer supported as a Convex type.");
		if (n === "$map") throw Error("Received a Map which is no longer supported as a Convex type.");
	}
	let n = {};
	for (let [t, r] of Object.entries(e)) F(t), n[t] = I(r);
	return n;
}
var Ee = 16384;
function L(e) {
	let t = JSON.stringify(e, (e, t) => t === void 0 ? "undefined" : typeof t == "bigint" ? `${t.toString()}n` : t);
	if (t.length > Ee) {
		let e = 16370, n = t.codePointAt(e - 1);
		return n !== void 0 && n > 65535 && --e, t.substring(0, e) + "[...truncated]";
	}
	return t;
}
function R(e, t, n, r) {
	if (e === void 0) {
		let e = n && ` (present at path ${n} in original object ${L(t)})`;
		throw Error(`undefined is not a valid Convex value${e}. To learn about Convex's supported types, see https://docs.convex.dev/using/types.`);
	}
	if (e === null) return e;
	if (typeof e == "bigint") {
		if (e < j || M < e) throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
		return { $integer: Ce(e) };
	}
	if (typeof e == "number") {
		if (ve(e)) {
			let t = /* @__PURE__ */ new ArrayBuffer(8);
			return new DataView(t).setFloat64(0, e, pe), { $float: k(new Uint8Array(t)) };
		}
		return e;
	}
	if (typeof e == "boolean" || typeof e == "string") return e;
	if (e instanceof ArrayBuffer) return { $bytes: k(new Uint8Array(e)) };
	if (e instanceof ge) return { $commitTs: null };
	if (Array.isArray(e)) return e.map((e, r) => R(e, t, n + `[${r}]`, !1));
	if (e instanceof Set) throw Error(z(n, "Set", [...e], t));
	if (e instanceof Map) throw Error(z(n, "Map", [...e], t));
	if (!fe(e)) {
		let r = e?.constructor?.name, i = r ? `${r} ` : "";
		throw Error(z(n, i, e, t));
	}
	let i = {}, a = Object.entries(e);
	a.sort(([e, t], [n, r]) => e === n ? 0 : e < n ? -1 : 1);
	for (let [e, o] of a) o === void 0 ? r && (F(e), i[e] = De(o, t, n + `.${e}`)) : (F(e), i[e] = R(o, t, n + `.${e}`, !1));
	return i;
}
function z(e, t, n, r) {
	return e ? `${t}${L(n)} is not a supported Convex type (present at path ${e} in original object ${L(r)}). To learn about Convex's supported types, see https://docs.convex.dev/using/types.` : `${t}${L(n)} is not a supported Convex type.`;
}
function De(e, t, n) {
	if (e === void 0) return { $undefined: null };
	if (t === void 0) throw Error(`Programming error. Current value is ${L(e)} but original value is undefined`);
	return R(e, t, n, !1);
}
function B(e) {
	return R(e, e, "", !1);
}
//#endregion
//#region node_modules/convex/dist/esm/values/errors.js
var Oe = Object.defineProperty, ke = (e, t, n) => t in e ? Oe(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, V = (e, t, n) => ke(e, typeof t == "symbol" ? t : t + "", n), Ae, je, Me = Symbol.for("ConvexError"), H = class extends (je = Error, Ae = Me, je) {
	constructor(e) {
		super(typeof e == "string" ? e : L(e)), V(this, "name", "ConvexError"), V(this, "data"), V(this, Ae, !0), this.data = e;
	}
}, Ne = Object.defineProperty, Pe = (e, t, n) => t in e ? Ne(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Fe = (e, t, n) => Pe(e, typeof t == "symbol" ? t : t + "", n), Ie = "color:rgb(0, 145, 255)";
function Le(e) {
	switch (e) {
		case "query": return "Q";
		case "mutation": return "M";
		case "action": return "A";
		case "any": return "?";
	}
}
var Re = class {
	constructor(e) {
		Fe(this, "_onLogLineFuncs"), Fe(this, "_verbose"), this._onLogLineFuncs = {}, this._verbose = e.verbose;
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
function ze(e) {
	let t = new Re(e);
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
function Be(e) {
	return new Re(e);
}
function U(e, t, n, r, i) {
	let a = Le(n);
	if (typeof i == "object" && (i = `ConvexError ${JSON.stringify(i.errorData, null, 2)}`), t === "info") {
		let t = i.match(/^\[.*?\] /);
		if (t === null) {
			e.error(`[CONVEX ${a}(${r})] Could not parse console.log`);
			return;
		}
		let n = i.slice(1, t[0].length - 2), o = i.slice(t[0].length);
		e.log(`%c[CONVEX ${a}(${r})] [${n}]`, Ie, o);
	} else e.error(`[CONVEX ${a}(${r})] ${i}`);
}
//#endregion
//#region node_modules/convex/dist/esm/server/functionName.js
var W = Symbol.for("functionName"), Ve = Symbol.for("toReferencePath");
function He(e) {
	return e[Ve] ?? null;
}
function Ue(e) {
	return e.startsWith("function://");
}
function We(e) {
	let t;
	if (typeof e == "string") t = Ue(e) ? { functionHandle: e } : { name: e };
	else if (e[W]) t = { name: e[W] };
	else {
		let n = He(e);
		if (!n) throw Error(`${e} is not a functionReference`);
		t = { reference: n };
	}
	return t;
}
//#endregion
//#region node_modules/convex/dist/esm/server/api.js
function G(e) {
	let t = We(e);
	if (t.name === void 0) throw t.functionHandle === void 0 ? t.reference === void 0 ? Error(`Expected function reference like "api.file.func" or "internal.file.func", but received ${JSON.stringify(t)}`) : Error(`Expected function reference in the current component like "api.file.func" or "internal.file.func", but received reference ${t.reference}`) : Error(`Expected function reference like "api.file.func" or "internal.file.func", but received function handle ${t.functionHandle}`);
	if (typeof e == "string") return e;
	let n = e[W];
	if (!n) throw Error(`${e} is not a functionReference`);
	return n;
}
function Ge(e = []) {
	return new Proxy({}, { get(t, n) {
		if (typeof n == "string") return Ge([...e, n]);
		if (n === W) {
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
var Ke = Ge(), qe = Object.defineProperty, Je = (e, t, n) => t in e ? qe(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, K = (e, t, n) => Je(e, typeof t == "symbol" ? t : t + "", n), q = void 0, Ye = class {
	constructor(e, t) {
		if (K(this, "address"), K(this, "auth"), K(this, "adminAuth"), K(this, "encodedTsPromise"), K(this, "debug"), K(this, "fetchOptions"), K(this, "fetch"), K(this, "logger"), K(this, "mutationQueue", []), K(this, "isProcessingQueue", !1), typeof t == "boolean") throw Error("skipConvexDeploymentUrlCheck as the second argument is no longer supported. Please pass an options object, `{ skipConvexDeploymentUrlCheck: true }`.");
		(t ?? {}).skipConvexDeploymentUrlCheck !== !0 && de(e), this.logger = t?.logger === !1 ? Be({ verbose: !1 }) : t?.logger !== !0 && t?.logger ? t.logger : ze({ verbose: !1 }), this.address = e, this.debug = !0, this.auth = void 0, this.adminAuth = void 0, this.fetch = t?.fetch, t?.auth && this.setAuth(t.auth);
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
		let n = A(t[0]), r = this.getTimestamp();
		return await this.queryInner(e, n, { timestampPromise: r });
	}
	async getTimestamp() {
		return this.encodedTsPromise ? this.encodedTsPromise : this.encodedTsPromise = this.getTimestampInner();
	}
	async getTimestampInner() {
		let e = this.fetch || q || fetch, t = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${C}`
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
		let n = A(t[0]);
		return await this.queryInner(e, n, {});
	}
	async queryInner(e, t, n) {
		let r = G(e), i = [B(t)], a = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${C}`
		};
		this.adminAuth ? a.Authorization = `Convex ${this.adminAuth}` : this.auth && (a.Authorization = `Bearer ${this.auth}`);
		let o = this.fetch || q || fetch, s = n.timestampPromise ? await n.timestampPromise : void 0, c = JSON.stringify({
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
		if (this.debug) for (let e of u.logLines ?? []) U(this.logger, "info", "query", r, e);
		switch (u.status) {
			case "success": return I(u.value);
			case "error": throw u.errorData === void 0 ? Error(u.errorMessage) : J(u.errorData, new H(u.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(u)}`);
		}
	}
	async mutationInner(e, t) {
		let n = G(e), r = JSON.stringify({
			path: n,
			format: "convex_encoded_json",
			args: [B(t)]
		}), i = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${C}`
		};
		this.adminAuth ? i.Authorization = `Convex ${this.adminAuth}` : this.auth && (i.Authorization = `Bearer ${this.auth}`);
		let a = await (this.fetch || q || fetch)(`${this.address}/api/mutation`, {
			...this.fetchOptions,
			body: r,
			method: "POST",
			headers: i
		});
		if (!a.ok && a.status !== 560) throw Error(await a.text());
		let o = await a.json();
		if (this.debug) for (let e of o.logLines ?? []) U(this.logger, "info", "mutation", n, e);
		switch (o.status) {
			case "success": return I(o.value);
			case "error": throw o.errorData === void 0 ? Error(o.errorMessage) : J(o.errorData, new H(o.errorMessage));
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
		let [n, r] = t, i = A(n);
		return r?.skipQueue ? await this.mutationInner(e, i) : await this.enqueueMutation(e, i);
	}
	async action(e, ...t) {
		let n = A(t[0]), r = G(e), i = JSON.stringify({
			path: r,
			format: "convex_encoded_json",
			args: [B(n)]
		}), a = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${C}`
		};
		this.adminAuth ? a.Authorization = `Convex ${this.adminAuth}` : this.auth && (a.Authorization = `Bearer ${this.auth}`);
		let o = await (this.fetch || q || fetch)(`${this.address}/api/action`, {
			...this.fetchOptions,
			body: i,
			method: "POST",
			headers: a
		});
		if (!o.ok && o.status !== 560) throw Error(await o.text());
		let s = await o.json();
		if (this.debug) for (let e of s.logLines ?? []) U(this.logger, "info", "action", r, e);
		switch (s.status) {
			case "success": return I(s.value);
			case "error": throw s.errorData === void 0 ? Error(s.errorMessage) : J(s.errorData, new H(s.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(s)}`);
		}
	}
	async function(e, t, ...n) {
		let r = A(n[0]), i = typeof e == "string" ? e : G(e), a = JSON.stringify({
			componentPath: t,
			path: i,
			format: "convex_encoded_json",
			args: B(r)
		}), o = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${C}`
		};
		this.adminAuth ? o.Authorization = `Convex ${this.adminAuth}` : this.auth && (o.Authorization = `Bearer ${this.auth}`);
		let s = await (this.fetch || q || fetch)(`${this.address}/api/function`, {
			...this.fetchOptions,
			body: a,
			method: "POST",
			headers: o
		});
		if (!s.ok && s.status !== 560) throw Error(await s.text());
		let c = await s.json();
		if (this.debug) for (let e of c.logLines ?? []) U(this.logger, "info", "any", i, e);
		switch (c.status) {
			case "success": return I(c.value);
			case "error": throw c.errorData === void 0 ? Error(c.errorMessage) : J(c.errorData, new H(c.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(c)}`);
		}
	}
};
function J(e, t) {
	return t.data = I(e), t;
}
//#endregion
//#region node_modules/convex/dist/esm/server/components/index.js
function Xe(e, t) {
	return new Proxy({}, { get(n, r) {
		if (typeof r == "string") return Xe(e, [...t, r]);
		if (r === Ve) {
			if (t.length < 1) {
				let n = [e, ...t].join(".");
				throw Error(`API path is expected to be of the form \`${e}.childComponent.functionName\`. Found: \`${n}\``);
			}
			return "_reference/childComponent/" + t.join("/");
		}
	} });
}
var Ze = () => Xe("components", []), Y = Ke;
Ze();
//#endregion
//#region extension/src/sharedAuthWorker.ts
var X = globalThis.chrome, Z = "https://calculating-gecko-263.convex.cloud", Q = e(Z), $ = ("cuelo-sidebar-" + Z).replace(/[^a-zA-Z0-9]/g, ""), Qe = r({
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
		let r = new Ye(Z, { logger: !1 });
		return n && r.setAuth(n), r.action(e === "signIn" ? Y.auth.signIn : Y.auth.signOut, t);
	},
	validate: async (e) => {
		let t = new Ye(Z, { logger: !1 });
		return t.setAuth(e), t.query(Y.auth.isAuthenticated, {});
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
	if (!i(t, X.runtime.id, Z) || e.backend !== Z) {
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
	return Qe.run(r).then(n).catch(() => n({ error: "Cuelo could not update your sign-in. Check your connection and try again." })), !0;
}), X.storage.onChanged.addListener((e, t) => {
	t === "local" && e[Q] && (X.runtime.sendMessage({
		type: "shared-auth-changed",
		backend: Z
	}).catch(() => {}), X.tabs.query({}).then((e) => Promise.allSettled(e.filter((e) => {
		try {
			return n(new URL(e.url).origin, Z);
		} catch {
			return !1;
		}
	}).map((e) => X.tabs.sendMessage(e.id, {
		type: "shared-auth-changed",
		backend: Z
	})))).catch(() => {}));
}), X.runtime.onInstalled.addListener(() => {
	a(X, Z).catch(() => {});
}), a(X, Z).catch(() => {});
//#endregion
