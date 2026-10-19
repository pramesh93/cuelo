//#region convex/authReturnPolicy.ts
var e = "calculating-gecko-263.convex.cloud";
function t(t, n, r) {
	let i = new URL(n);
	if (i.protocol !== "https:" || i.port !== "" || i.origin !== n || ![e, "deafening-frog-846.convex.cloud"].includes(i.hostname)) throw Error("Invalid sign-in environment.");
	let a = [n.replace(".convex.cloud", ".convex.site"), ...i.hostname === e ? ["http://127.0.0.1:5173"] : []];
	if (!a.includes(r) || t.startsWith("//")) throw Error("Invalid sign-in return.");
	let o = new URL(t, r), s = o.searchParams.get("view");
	if (!a.includes(o.origin) || o.username || o.password || o.pathname !== "/" || o.hash || o.searchParams.getAll("view").length !== 1 || ![
		"home",
		"sources",
		"account",
		"extension-auth"
	].includes(s ?? "") || [...o.searchParams.keys()].some((e) => e !== "view" && (s !== "extension-auth" || e !== "state")) || s === "extension-auth" && (o.searchParams.getAll("state").length !== 1 || !/^[a-f0-9]{64}$/.test(o.searchParams.get("state") ?? ""))) throw Error("Invalid sign-in return.");
	return o.href;
}
//#endregion
//#region src/auth/sharedSession.ts
var n = (e) => "cuelo-shared-session:" + e;
function r(e) {
	try {
		return JSON.parse(atob(e.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub;
	} catch {
		return null;
	}
}
function i(e, t) {
	return e === t.replace(".convex.cloud", ".convex.site") || t.includes("calculating-gecko-263") && e === "http://127.0.0.1:5173";
}
function a(e) {
	let n = Promise.resolve(), i = (e) => ({
		token: e.token,
		revision: e.revision,
		established: e.established
	});
	async function a(n) {
		let a = await e.load();
		if (!a) {
			let t = await e.legacy();
			a = {
				token: t?.token ?? null,
				refreshToken: t?.refreshToken ?? null,
				revision: 0,
				established: !!t
			}, await e.save(a);
		}
		async function o(t, n = !1) {
			r(a.token) !== r(t?.token ?? null) && await e.stopCall(), a = {
				token: t?.token ?? null,
				refreshToken: t?.refreshToken ?? null,
				revision: a.revision + 1,
				established: !0,
				...!n && t ? { attempts: a.attempts } : {}
			}, await e.save(a);
		}
		if (n.operation === "state") return { state: i(a) };
		if (n.operation === "import") {
			if (a.established) return { state: i(a) };
			let t = n.tokens;
			if (!t || typeof t.token != "string" || typeof t.refreshToken != "string" || t.token.length > 2e4 || t.refreshToken.length > 2e4) throw Error("Invalid existing sign-in.");
			if (!await e.validate(t.token)) throw Error("Your previous website sign-in expired. Sign in again.");
			let s = await e.call("signIn", { refreshToken: t.refreshToken }, null);
			if (!s.tokens || r(s.tokens.token)?.split("|")[0] !== r(t.token)?.split("|")[0]) throw Error("Your previous website sign-in expired. Sign in again.");
			return await o(s.tokens), { state: i(a) };
		}
		if (n.operation === "signOut") {
			let t = a.token;
			await o(null);
			try {
				await e.call("signOut", {}, t);
			} catch {}
			return { state: i(a) };
		}
		if (n.operation === "refresh") return !a.refreshToken || n.token !== a.token || await o((await e.call("signIn", { refreshToken: a.refreshToken }, null)).tokens ?? null), { state: i(a) };
		if (n.operation === "signIn") {
			let r = n.args ?? {};
			if (r.provider !== void 0 && r.provider !== "google") throw Error("Use Google sign-in only.");
			if ("refreshToken" in r || "code" in r) throw Error("Invalid sign-in request.");
			let s = r.params;
			if (r.provider === "google" && s?.code !== void 0) throw Error("Complete only the original sign-in attempt.");
			if (r.provider !== "google" && (typeof s?.code != "string" || typeof r.verifier != "string")) throw Error("Invalid sign-in completion.");
			if (s?.redirectTo !== void 0) {
				if (typeof s.redirectTo != "string") throw Error("Invalid sign-in return.");
				t(s.redirectTo, e.backend, e.backend.replace(".convex.cloud", ".convex.site"));
			}
			if (r.provider !== "google") {
				if (typeof s?.code != "string" || s.code.length > 2048 || typeof r.verifier != "string" || !((a.attempts?.[r.verifier] ?? 0) > Date.now())) throw Error("This sign-in attempt expired or was cancelled.");
				let t = { ...a.attempts };
				delete t[r.verifier], a = {
					...a,
					attempts: t
				}, await e.save(a);
			}
			let c = await e.call("signIn", r, a.token);
			if (c.redirect) {
				if (typeof c.verifier != "string" || c.verifier.length > 2e4) throw Error("Invalid sign-in verifier.");
				let t = Object.fromEntries(Object.entries(a.attempts ?? {}).filter(([, e]) => e > Date.now()).slice(-3));
				t[c.verifier] = Date.now() + 18e4, a = {
					...a,
					attempts: t
				}, await e.save(a);
			}
			return c.tokens !== void 0 && await o(c.tokens, !0), {
				state: i(a),
				...c.redirect ? {
					redirect: c.redirect,
					verifier: c.verifier
				} : {}
			};
		}
		throw Error("Unknown shared sign-in action.");
	}
	return { run(e) {
		let t = n.then(() => a(e));
		return n = t.then(() => {}, () => {}), t;
	} };
}
function o(e, t, n) {
	if (e.id !== t) return !1;
	if (e.url === `chrome-extension://${t}/auth-check.html` || e.url === `chrome-extension://${t}/call.html`) return !0;
	try {
		return e.frameId === 0 && i(new URL(e.url).origin, n);
	} catch {
		return !1;
	}
}
//#endregion
//#region extension/src/connectOpenWebsites.ts
async function s(e, t) {
	let n = await e.tabs.query({});
	await Promise.allSettled(n.filter((e) => {
		try {
			return Number.isInteger(e.id) && i(new URL(e.url).origin, t);
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
function c(e, t) {
	let n;
	try {
		n = new URL(e);
	} catch {
		throw Error("Invalid sign-in address.");
	}
	if (n.origin !== t || n.pathname !== "/api/auth/signin/google" || n.username || n.password || !n.searchParams.get("code")) throw Error("Use Cuelo’s Google sign-in only.");
	return n.href;
}
function l(e, t, n) {
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
var u = {
	siteOrigin: "https://calculating-gecko-263.convex.site",
	returnOrigin: "http://127.0.0.1:5173"
}, d = null, f = null, p = null, m = 0, h = !1, g = () => chrome.storage.session.get("cueloCallBinding").then((e) => e.cueloCallBinding ?? null), ee = () => chrome.storage.session.get("cueloSidebarWindowId").then((e) => e.cueloSidebarWindowId), _ = (e) => chrome.storage.session.set({ cueloCallBinding: e }), v = (e) => typeof e?.url == "string" && /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/.test(e.url), y = async (e) => {
	try {
		return (await chrome.tabs.sendMessage(e, { type: "call-state" })).joined === !0;
	} catch {
		return !1;
	}
}, b = async () => (await chrome.runtime.getContexts({
	contextTypes: ["OFFSCREEN_DOCUMENT"],
	documentUrls: [chrome.runtime.getURL("call.html")]
})).length > 0, x = (e) => chrome.runtime.sendMessage({
	...e,
	to: "call"
});
async function te() {
	await b() || (d ||= chrome.offscreen.createDocument({
		url: "call.html",
		reasons: ["USER_MEDIA"],
		justification: "Keep the authenticated speech connection alive for separate Meet-page audio inputs."
	}).finally(() => {
		d = null;
	}), await d);
}
async function S() {
	if (!await b()) return p ? {
		...p,
		state: "idle",
		busy: !1,
		controlsBusy: !1,
		result: null,
		previousAnswers: []
	} : null;
	try {
		return (await x({ type: "status" })).view ?? null;
	} catch {
		return null;
	}
}
async function C(e) {
	return m++, h = !1, f || (f = (async () => {
		let t = await g();
		t?.nonce && await chrome.tabs.sendMessage(t.tabId, {
			to: "meet-audio",
			type: "stop",
			nonce: t.nonce
		}).catch(() => {}), await b() && (await x({
			type: "stop",
			message: e
		}), await chrome.offscreen.closeDocument());
	})().finally(() => {
		f = null;
	}), f);
}
chrome.action.onClicked.addListener((e) => {
	(async () => {
		await chrome.storage.session.set({ cueloSidebarWindowId: e.windowId });
		let t = await S();
		h || t && t.state !== "idle" || (m++, await _(v(e) ? {
			tabId: e.id,
			windowId: e.windowId
		} : null));
	})().catch(() => {});
});
async function ne(e) {
	let t = await S();
	if (await g(), t && t.state !== "idle") return {
		eligible: !0,
		view: t
	};
	let n = (await chrome.tabs.query({
		active: !0,
		windowId: e.tab?.windowId ?? await ee() ?? chrome.windows.WINDOW_ID_CURRENT
	}))[0], r = v(n) && await y(n.id);
	return {
		eligible: r,
		setupAvailable: r,
		meeting: r,
		view: t
	};
}
async function re(e) {
	if (f) throw Error("Cuelo is still stopping.");
	if (h) throw Error("Cuelo is already connecting.");
	h = !0;
	let t = ++m;
	try {
		let n = await S();
		if (!e.resume && n && n.state !== "idle") throw Error("Stop the current Cuelo session first.");
		let r = await g();
		if (!e.resume) {
			let e = (await chrome.tabs.query({
				active: !0,
				windowId: await ee() ?? chrome.windows.WINDOW_ID_CURRENT
			}))[0];
			if (!v(e) || !await y(e.id)) throw Error("Join a Meet call before starting Cuelo.");
			r = {
				tabId: e.id,
				windowId: e.windowId
			};
		}
		if (!r || !await y(r.tabId)) throw Error("Join a Meet call before starting Cuelo.");
		let i = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32)), a = Array.from(i, (e) => e.toString(16).padStart(2, "0")).join("");
		if (r = {
			...r,
			nonce: a
		}, await _(r), t !== m) throw Error("Start cancelled.");
		if (!e.resume && await b()) {
			let e = await S();
			if (e && e.state !== "idle") throw Error("Stop the current Cuelo session first.");
			await chrome.offscreen.closeDocument();
		}
		await te();
		for (let e = 0; e < 100; e++) {
			if (t !== m) throw Error("Start cancelled.");
			if ((await x({ type: "status" }).catch(() => null))?.ready) break;
			if (e === 99) throw Error("Cuelo’s listening page could not get ready. Reload the extension and try again.");
			await new Promise((e) => setTimeout(e, 100));
		}
		if (t !== m || !await y(r.tabId)) throw Error("The meeting ended before Cuelo connected.");
		let o;
		try {
			o = await chrome.tabCapture.getMediaStreamId({ targetTabId: r.tabId });
		} catch {
			throw Error("Open the Meet tab and click the Cuelo extension icon, then try Start or Resume again. Chrome needs that click to allow meeting audio.");
		}
		if (t !== m) throw Error("Start cancelled.");
		let s = await x({
			...e,
			type: "start",
			nonce: a,
			streamId: o
		});
		if (s?.error) throw Error(s.error);
		return s;
	} finally {
		if (t === m) h = !1;
		else if (!h && await b()) {
			let e = await S();
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
	})() : i && e.type === "call-view" ? (p = e.view, a = Promise.resolve({})) : i && e.type === "call-alive" ? a = (async () => {
		let e = await g();
		if (!e || !await y(e.tabId)) return await C("Meeting ended. Audio and transcription are off."), {};
		if ((await S())?.state === "listening") {
			let t = await chrome.tabs.sendMessage(e.tabId, {
				to: "meet-audio",
				type: "status",
				nonce: e.nonce
			}).catch(() => null);
			return !t || t.error || t.state !== "listening" ? (await C("Meeting audio disconnected. Cuelo stopped."), {}) : { audio: {
				microphoneLevel: t.microphoneLevel,
				microphoneState: t.microphoneState
			} };
		}
		return {};
	})() : i && e.type === "meet-audio-control" ? a = (async () => {
		let t = await g();
		if (!t || e.nonce !== t.nonce) throw Error("Old audio connection.");
		if (![
			"prepare",
			"stream",
			"stop",
			"status"
		].includes(e.operation)) throw Error("Unknown audio action.");
		if (e.operation !== "stop" && !await y(t.tabId)) throw Error("The meeting ended.");
		return chrome.tabs.sendMessage(t.tabId, {
			to: "meet-audio",
			type: e.operation,
			nonce: t.nonce,
			...e.operation === "stream" ? { deadline: e.deadline } : {}
		});
	})() : e.type === "meet-audio-frame" || e.type === "meet-audio-ended" ? a = (async () => {
		let n = await g();
		if (t.id !== chrome.runtime.id || t.frameId !== 0 || !v(t.tab) || t.tab?.id !== n?.tabId || e.nonce !== n?.nonce) throw Error("Audio sender is not this meeting.");
		if (e.type === "meet-audio-ended") return await C(typeof e.message == "string" ? e.message.slice(0, 200) : "Meeting audio disconnected. Cuelo stopped."), {};
		if (!["customer", "salesperson"].includes(e.speaker) || typeof e.frame != "string" || e.frame.length !== 2136 || !Number.isSafeInteger(e.sequence) || e.sequence < 1) throw Error("Unreadable meeting audio.");
		return x({
			type: "audio-frame",
			nonce: n.nonce,
			speaker: e.speaker,
			sequence: e.sequence,
			frame: e.frame
		});
	})() : r && e.type === "sidebar-status" ? a = ne(t) : r && e.type === "start" ? a = re(e) : r && e.type === "typed-question" ? a = (async () => {
		if (typeof e.text != "string" || !e.text.trim() || e.text.trim().length > 1e3) throw Error("Type a question using 1 to 1,000 characters.");
		let t = await g();
		if (!t || !await y(t.tabId) || !await b()) throw Error("Join a Meet call and start Cuelo before typing a question.");
		return x({
			type: "typed-question",
			text: e.text.trim()
		});
	})() : r && e.type === "pause" ? a = (async () => {
		let e = await g();
		return e?.nonce && await chrome.tabs.sendMessage(e.tabId, {
			to: "meet-audio",
			type: "stop",
			nonce: e.nonce
		}).catch(() => {}), x({ type: "pause" });
	})() : r && e.type === "stop" ? a = C("Stopped. Audio and transcription are off.").then(() => ({})) : e.type === "left" && t.id === chrome.runtime.id && v(t.tab) && t.tab?.id && (a = (async () => ((await g())?.tabId === t.tab.id && await C("Meeting ended. Audio and transcription are off."), {}))()), a) return a.then(n).catch((e) => n({ error: e instanceof Error ? e.message : "Cuelo could not finish this action." })), !0;
}), chrome.tabs.onRemoved.addListener((e) => {
	(async () => {
		(await g())?.tabId === e && (await C("Meet tab closed. Audio and transcription are off."), await _(null));
	})().catch(() => {});
});
//#endregion
//#region extension/meet/auth-worker.js
var w = null;
chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }).catch(() => {}), chrome.action.onClicked.addListener((e) => {
	e.id && chrome.sidePanel.open({ windowId: e.windowId }).catch(() => {});
}), chrome.runtime.onConnect.addListener((e) => {
	if (e.name !== "cuelo-signin" || e.sender?.url !== chrome.runtime.getURL("auth-check.html")) {
		e.disconnect();
		return;
	}
	let t = async (t) => {
		if (w?.port !== e) return;
		let n = w;
		w = null, clearTimeout(n.timer), Number.isInteger(n.windowId) && await chrome.windows.remove(n.windowId).catch(() => {});
		try {
			e.postMessage(t);
		} catch {}
	};
	e.onMessage.addListener((n) => {
		if (n?.type !== "ping") {
			if (n?.type !== "signin" || w) {
				e.postMessage({ error: "Google sign-in is already open. Finish it or close the window." });
				return;
			}
			(async () => {
				try {
					if (typeof n.nonce != "string" || !/^[a-f0-9]{64}$/.test(n.nonce)) throw Error("Invalid sign-in request.");
					let r = c(n.redirect, u.siteOrigin), i = {
						port: e,
						nonce: n.nonce,
						windowId: null,
						timer: setTimeout(() => {
							t({ error: "Google sign-in timed out. Try again." });
						}, 18e4)
					};
					w = i;
					let a = await chrome.windows.create({
						url: r,
						type: "popup",
						width: 500,
						height: 700,
						focused: !0
					});
					if (w !== i) {
						Number.isInteger(a.id) && await chrome.windows.remove(a.id).catch(() => {});
						return;
					}
					if (!Number.isInteger(a.id)) throw Error("Sign-in window did not open.");
					i.windowId = a.id;
					let o = await chrome.tabs.query({ windowId: a.id });
					for (let e of o) ie(e.url, e.windowId);
				} catch {
					if (w?.port === e) await t({ error: "Google sign-in could not open. Try again." });
					else try {
						e.postMessage({ error: "Google sign-in could not open safely. Try again." });
					} catch {}
				}
			})();
		}
	}), e.onDisconnect.addListener(() => {
		w?.port === e && t({ error: "Sign-in cancelled because the sidebar closed." });
	});
});
function ie(e, t) {
	let n = w;
	if (n && t === n.windowId && e) try {
		let t = l(e, u.returnOrigin, n.nonce);
		if (!t) return;
		w = null, clearTimeout(n.timer), chrome.windows.remove(n.windowId).catch(() => {}).finally(() => {
			try {
				n.port.postMessage({ code: t });
			} catch {}
		});
	} catch {
		let e = n.port;
		w = null, clearTimeout(n.timer), chrome.windows.remove(n.windowId).catch(() => {}).finally(() => {
			try {
				e.postMessage({ error: "Google sign-in could not be verified. Try again." });
			} catch {}
		});
	}
}
chrome.tabs.onUpdated.addListener((e, t, n) => ie(t.url, n.windowId)), chrome.windows.onRemoved.addListener((e) => {
	let t = w;
	if (t?.windowId === e) {
		w = null, clearTimeout(t.timer);
		try {
			t.port.postMessage({ error: "Google sign-in was cancelled. You can try again." });
		} catch {}
	}
});
for (var T = "1.46.0", E = [], D = [], ae = Uint8Array, oe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", O = 0, se = oe.length; O < se; ++O) E[O] = oe[O], D[oe.charCodeAt(O)] = O;
D[45] = 62, D[95] = 63;
function ce(e) {
	var t = e.length;
	if (t % 4 > 0) throw Error("Invalid string. Length must be a multiple of 4");
	var n = e.indexOf("=");
	n === -1 && (n = t);
	var r = n === t ? 0 : 4 - n % 4;
	return [n, r];
}
function le(e, t, n) {
	return (t + n) * 3 / 4 - n;
}
function k(e) {
	for (var t, n = ce(e), r = n[0], i = n[1], a = new ae(le(e, r, i)), o = 0, s = i > 0 ? r - 4 : r, c = 0; c < s; c += 4) t = D[e.charCodeAt(c)] << 18 | D[e.charCodeAt(c + 1)] << 12 | D[e.charCodeAt(c + 2)] << 6 | D[e.charCodeAt(c + 3)], a[o++] = t >> 16 & 255, a[o++] = t >> 8 & 255, a[o++] = t & 255;
	return i === 2 && (t = D[e.charCodeAt(c)] << 2 | D[e.charCodeAt(c + 1)] >> 4, a[o++] = t & 255), i === 1 && (t = D[e.charCodeAt(c)] << 10 | D[e.charCodeAt(c + 1)] << 4 | D[e.charCodeAt(c + 2)] >> 2, a[o++] = t >> 8 & 255, a[o++] = t & 255), a;
}
function ue(e) {
	return E[e >> 18 & 63] + E[e >> 12 & 63] + E[e >> 6 & 63] + E[e & 63];
}
function de(e, t, n) {
	for (var r, i = [], a = t; a < n; a += 3) r = (e[a] << 16 & 16711680) + (e[a + 1] << 8 & 65280) + (e[a + 2] & 255), i.push(ue(r));
	return i.join("");
}
function A(e) {
	for (var t, n = e.length, r = n % 3, i = [], a = 16383, o = 0, s = n - r; o < s; o += a) i.push(de(e, o, o + a > s ? s : o + a));
	return r === 1 ? (t = e[n - 1], i.push(E[t >> 2] + E[t << 4 & 63] + "==")) : r === 2 && (t = (e[n - 2] << 8) + e[n - 1], i.push(E[t >> 10] + E[t >> 4 & 63] + E[t << 2 & 63] + "=")), i.join("");
}
//#endregion
//#region node_modules/convex/dist/esm/common/index.js
function j(e) {
	if (e === void 0) return {};
	if (!pe(e)) throw Error(`The arguments to a Convex function must be an object. Received: ${e}`);
	return e;
}
function fe(e) {
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
function pe(e) {
	let t = typeof e == "object", n = Object.getPrototypeOf(e), r = n === null || n === Object.prototype || n?.constructor?.name === "Object";
	return t && r;
}
//#endregion
//#region node_modules/convex/dist/esm/values/value.js
var me = !0, M = BigInt("-9223372036854775808"), N = BigInt("9223372036854775807"), P = BigInt("0"), he = BigInt("8"), ge = BigInt("256"), F = "This commit timestamp is unresolved: its value is assigned when the mutation commits. Read the document after the mutation completes to get its value.", _e = class {
	[Symbol.toPrimitive](e) {
		if (e === "string") return this.toString();
		throw Error(F);
	}
	valueOf() {
		throw Error(F);
	}
	toJSON() {
		throw Error(F);
	}
	toString() {
		return "[unresolved commit timestamp]";
	}
}, ve = new _e();
function ye(e) {
	return Number.isNaN(e) || !Number.isFinite(e) || Object.is(e, -0);
}
function be(e) {
	e < P && (e -= M + M);
	let t = e.toString(16);
	t.length % 2 == 1 && (t = "0" + t);
	let n = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(8)), r = 0;
	for (let i of t.match(/.{2}/g).reverse()) n.set([parseInt(i, 16)], r++), e >>= he;
	return A(n);
}
function xe(e) {
	let t = k(e);
	if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
	let n = P, r = P;
	for (let e of t) n += BigInt(e) * ge ** r, r++;
	return n > N && (n += M + M), n;
}
function Se(e) {
	if (e < M || N < e) throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
	let t = /* @__PURE__ */ new ArrayBuffer(8);
	return new DataView(t).setBigInt64(0, e, !0), A(new Uint8Array(t));
}
function Ce(e) {
	let t = k(e);
	if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
	return new DataView(t.buffer).getBigInt64(0, !0);
}
var we = DataView.prototype.setBigInt64 ? Se : be, Te = DataView.prototype.getBigInt64 ? Ce : xe, Ee = 1024;
function I(e) {
	if (e.length > Ee) throw Error(`Field name ${e} exceeds maximum field name length ${Ee}.`);
	if (e.startsWith("$")) throw Error(`Field name ${e} starts with a '$', which is reserved.`);
	for (let t = 0; t < e.length; t += 1) {
		let n = e.charCodeAt(t);
		if (n < 32 || n >= 127) throw Error(`Field name ${e} has invalid character '${e[t]}': Field names can only contain non-control ASCII characters`);
	}
}
function L(e) {
	if (e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string") return e;
	if (Array.isArray(e)) return e.map((e) => L(e));
	if (typeof e != "object") throw Error(`Unexpected type of ${e}`);
	let t = Object.entries(e);
	if (t.length === 1) {
		let n = t[0][0];
		if (n === "$bytes") {
			if (typeof e.$bytes != "string") throw Error(`Malformed $bytes field on ${e}`);
			return k(e.$bytes).buffer;
		}
		if (n === "$integer") {
			if (typeof e.$integer != "string") throw Error(`Malformed $integer field on ${e}`);
			return Te(e.$integer);
		}
		if (n === "$float") {
			if (typeof e.$float != "string") throw Error(`Malformed $float field on ${e}`);
			let t = k(e.$float);
			if (t.byteLength !== 8) throw Error(`Received ${t.byteLength} bytes, expected 8 for $float`);
			let n = new DataView(t.buffer).getFloat64(0, me);
			if (!ye(n)) throw Error(`Float ${n} should be encoded as a number`);
			return n;
		}
		if (n === "$commitTs") {
			if (e.$commitTs !== null) throw Error(`Malformed $commitTs field on ${e}`);
			return ve;
		}
		if (n === "$set") throw Error("Received a Set which is no longer supported as a Convex type.");
		if (n === "$map") throw Error("Received a Map which is no longer supported as a Convex type.");
	}
	let n = {};
	for (let [t, r] of Object.entries(e)) I(t), n[t] = L(r);
	return n;
}
var De = 16384;
function R(e) {
	let t = JSON.stringify(e, (e, t) => t === void 0 ? "undefined" : typeof t == "bigint" ? `${t.toString()}n` : t);
	if (t.length > De) {
		let e = 16370, n = t.codePointAt(e - 1);
		return n !== void 0 && n > 65535 && --e, t.substring(0, e) + "[...truncated]";
	}
	return t;
}
function z(e, t, n, r) {
	if (e === void 0) {
		let e = n && ` (present at path ${n} in original object ${R(t)})`;
		throw Error(`undefined is not a valid Convex value${e}. To learn about Convex's supported types, see https://docs.convex.dev/using/types.`);
	}
	if (e === null) return e;
	if (typeof e == "bigint") {
		if (e < M || N < e) throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
		return { $integer: we(e) };
	}
	if (typeof e == "number") {
		if (ye(e)) {
			let t = /* @__PURE__ */ new ArrayBuffer(8);
			return new DataView(t).setFloat64(0, e, me), { $float: A(new Uint8Array(t)) };
		}
		return e;
	}
	if (typeof e == "boolean" || typeof e == "string") return e;
	if (e instanceof ArrayBuffer) return { $bytes: A(new Uint8Array(e)) };
	if (e instanceof _e) return { $commitTs: null };
	if (Array.isArray(e)) return e.map((e, r) => z(e, t, n + `[${r}]`, !1));
	if (e instanceof Set) throw Error(B(n, "Set", [...e], t));
	if (e instanceof Map) throw Error(B(n, "Map", [...e], t));
	if (!pe(e)) {
		let r = e?.constructor?.name, i = r ? `${r} ` : "";
		throw Error(B(n, i, e, t));
	}
	let i = {}, a = Object.entries(e);
	a.sort(([e, t], [n, r]) => e === n ? 0 : e < n ? -1 : 1);
	for (let [e, o] of a) o === void 0 ? r && (I(e), i[e] = Oe(o, t, n + `.${e}`)) : (I(e), i[e] = z(o, t, n + `.${e}`, !1));
	return i;
}
function B(e, t, n, r) {
	return e ? `${t}${R(n)} is not a supported Convex type (present at path ${e} in original object ${R(r)}). To learn about Convex's supported types, see https://docs.convex.dev/using/types.` : `${t}${R(n)} is not a supported Convex type.`;
}
function Oe(e, t, n) {
	if (e === void 0) return { $undefined: null };
	if (t === void 0) throw Error(`Programming error. Current value is ${R(e)} but original value is undefined`);
	return z(e, t, n, !1);
}
function V(e) {
	return z(e, e, "", !1);
}
//#endregion
//#region node_modules/convex/dist/esm/values/errors.js
var ke = Object.defineProperty, Ae = (e, t, n) => t in e ? ke(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, H = (e, t, n) => Ae(e, typeof t == "symbol" ? t : t + "", n), je, Me, Ne = Symbol.for("ConvexError"), U = class extends (Me = Error, je = Ne, Me) {
	constructor(e) {
		super(typeof e == "string" ? e : R(e)), H(this, "name", "ConvexError"), H(this, "data"), H(this, je, !0), this.data = e;
	}
}, Pe = Object.defineProperty, Fe = (e, t, n) => t in e ? Pe(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Ie = (e, t, n) => Fe(e, typeof t == "symbol" ? t : t + "", n), Le = "color:rgb(0, 145, 255)";
function Re(e) {
	switch (e) {
		case "query": return "Q";
		case "mutation": return "M";
		case "action": return "A";
		case "any": return "?";
	}
}
var ze = class {
	constructor(e) {
		Ie(this, "_onLogLineFuncs"), Ie(this, "_verbose"), this._onLogLineFuncs = {}, this._verbose = e.verbose;
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
function Be(e) {
	let t = new ze(e);
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
function Ve(e) {
	return new ze(e);
}
function W(e, t, n, r, i) {
	let a = Re(n);
	if (typeof i == "object" && (i = `ConvexError ${JSON.stringify(i.errorData, null, 2)}`), t === "info") {
		let t = i.match(/^\[.*?\] /);
		if (t === null) {
			e.error(`[CONVEX ${a}(${r})] Could not parse console.log`);
			return;
		}
		let n = i.slice(1, t[0].length - 2), o = i.slice(t[0].length);
		e.log(`%c[CONVEX ${a}(${r})] [${n}]`, Le, o);
	} else e.error(`[CONVEX ${a}(${r})] ${i}`);
}
//#endregion
//#region node_modules/convex/dist/esm/server/functionName.js
var G = Symbol.for("functionName"), He = Symbol.for("toReferencePath");
function Ue(e) {
	return e[He] ?? null;
}
function We(e) {
	return e.startsWith("function://");
}
function Ge(e) {
	let t;
	if (typeof e == "string") t = We(e) ? { functionHandle: e } : { name: e };
	else if (e[G]) t = { name: e[G] };
	else {
		let n = Ue(e);
		if (!n) throw Error(`${e} is not a functionReference`);
		t = { reference: n };
	}
	return t;
}
//#endregion
//#region node_modules/convex/dist/esm/server/api.js
function K(e) {
	let t = Ge(e);
	if (t.name === void 0) throw t.functionHandle === void 0 ? t.reference === void 0 ? Error(`Expected function reference like "api.file.func" or "internal.file.func", but received ${JSON.stringify(t)}`) : Error(`Expected function reference in the current component like "api.file.func" or "internal.file.func", but received reference ${t.reference}`) : Error(`Expected function reference like "api.file.func" or "internal.file.func", but received function handle ${t.functionHandle}`);
	if (typeof e == "string") return e;
	let n = e[G];
	if (!n) throw Error(`${e} is not a functionReference`);
	return n;
}
function Ke(e = []) {
	return new Proxy({}, { get(t, n) {
		if (typeof n == "string") return Ke([...e, n]);
		if (n === G) {
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
var qe = Ke(), Je = Object.defineProperty, Ye = (e, t, n) => t in e ? Je(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, q = (e, t, n) => Ye(e, typeof t == "symbol" ? t : t + "", n), J = void 0, Xe = class {
	constructor(e, t) {
		if (q(this, "address"), q(this, "auth"), q(this, "adminAuth"), q(this, "encodedTsPromise"), q(this, "debug"), q(this, "fetchOptions"), q(this, "fetch"), q(this, "logger"), q(this, "mutationQueue", []), q(this, "isProcessingQueue", !1), typeof t == "boolean") throw Error("skipConvexDeploymentUrlCheck as the second argument is no longer supported. Please pass an options object, `{ skipConvexDeploymentUrlCheck: true }`.");
		(t ?? {}).skipConvexDeploymentUrlCheck !== !0 && fe(e), this.logger = t?.logger === !1 ? Ve({ verbose: !1 }) : t?.logger !== !0 && t?.logger ? t.logger : Be({ verbose: !1 }), this.address = e, this.debug = !0, this.auth = void 0, this.adminAuth = void 0, this.fetch = t?.fetch, t?.auth && this.setAuth(t.auth);
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
		let n = j(t[0]), r = this.getTimestamp();
		return await this.queryInner(e, n, { timestampPromise: r });
	}
	async getTimestamp() {
		return this.encodedTsPromise ? this.encodedTsPromise : this.encodedTsPromise = this.getTimestampInner();
	}
	async getTimestampInner() {
		let e = this.fetch || J || fetch, t = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${T}`
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
		let n = j(t[0]);
		return await this.queryInner(e, n, {});
	}
	async queryInner(e, t, n) {
		let r = K(e), i = [V(t)], a = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${T}`
		};
		this.adminAuth ? a.Authorization = `Convex ${this.adminAuth}` : this.auth && (a.Authorization = `Bearer ${this.auth}`);
		let o = this.fetch || J || fetch, s = n.timestampPromise ? await n.timestampPromise : void 0, c = JSON.stringify({
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
		if (this.debug) for (let e of u.logLines ?? []) W(this.logger, "info", "query", r, e);
		switch (u.status) {
			case "success": return L(u.value);
			case "error": throw u.errorData === void 0 ? Error(u.errorMessage) : Y(u.errorData, new U(u.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(u)}`);
		}
	}
	async mutationInner(e, t) {
		let n = K(e), r = JSON.stringify({
			path: n,
			format: "convex_encoded_json",
			args: [V(t)]
		}), i = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${T}`
		};
		this.adminAuth ? i.Authorization = `Convex ${this.adminAuth}` : this.auth && (i.Authorization = `Bearer ${this.auth}`);
		let a = await (this.fetch || J || fetch)(`${this.address}/api/mutation`, {
			...this.fetchOptions,
			body: r,
			method: "POST",
			headers: i
		});
		if (!a.ok && a.status !== 560) throw Error(await a.text());
		let o = await a.json();
		if (this.debug) for (let e of o.logLines ?? []) W(this.logger, "info", "mutation", n, e);
		switch (o.status) {
			case "success": return L(o.value);
			case "error": throw o.errorData === void 0 ? Error(o.errorMessage) : Y(o.errorData, new U(o.errorMessage));
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
		let [n, r] = t, i = j(n);
		return r?.skipQueue ? await this.mutationInner(e, i) : await this.enqueueMutation(e, i);
	}
	async action(e, ...t) {
		let n = j(t[0]), r = K(e), i = JSON.stringify({
			path: r,
			format: "convex_encoded_json",
			args: [V(n)]
		}), a = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${T}`
		};
		this.adminAuth ? a.Authorization = `Convex ${this.adminAuth}` : this.auth && (a.Authorization = `Bearer ${this.auth}`);
		let o = await (this.fetch || J || fetch)(`${this.address}/api/action`, {
			...this.fetchOptions,
			body: i,
			method: "POST",
			headers: a
		});
		if (!o.ok && o.status !== 560) throw Error(await o.text());
		let s = await o.json();
		if (this.debug) for (let e of s.logLines ?? []) W(this.logger, "info", "action", r, e);
		switch (s.status) {
			case "success": return L(s.value);
			case "error": throw s.errorData === void 0 ? Error(s.errorMessage) : Y(s.errorData, new U(s.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(s)}`);
		}
	}
	async function(e, t, ...n) {
		let r = j(n[0]), i = typeof e == "string" ? e : K(e), a = JSON.stringify({
			componentPath: t,
			path: i,
			format: "convex_encoded_json",
			args: V(r)
		}), o = {
			"Content-Type": "application/json",
			"Convex-Client": `npm-${T}`
		};
		this.adminAuth ? o.Authorization = `Convex ${this.adminAuth}` : this.auth && (o.Authorization = `Bearer ${this.auth}`);
		let s = await (this.fetch || J || fetch)(`${this.address}/api/function`, {
			...this.fetchOptions,
			body: a,
			method: "POST",
			headers: o
		});
		if (!s.ok && s.status !== 560) throw Error(await s.text());
		let c = await s.json();
		if (this.debug) for (let e of c.logLines ?? []) W(this.logger, "info", "any", i, e);
		switch (c.status) {
			case "success": return L(c.value);
			case "error": throw c.errorData === void 0 ? Error(c.errorMessage) : Y(c.errorData, new U(c.errorMessage));
			default: throw Error(`Invalid response: ${JSON.stringify(c)}`);
		}
	}
};
function Y(e, t) {
	return t.data = L(e), t;
}
//#endregion
//#region node_modules/convex/dist/esm/server/components/index.js
function Ze(e, t) {
	return new Proxy({}, { get(n, r) {
		if (typeof r == "string") return Ze(e, [...t, r]);
		if (r === He) {
			if (t.length < 1) {
				let n = [e, ...t].join(".");
				throw Error(`API path is expected to be of the form \`${e}.childComponent.functionName\`. Found: \`${n}\``);
			}
			return "_reference/childComponent/" + t.join("/");
		}
	} });
}
var Qe = () => Ze("components", []), $e = qe;
Qe();
//#endregion
//#region extension/src/sharedAuthWorker.ts
var X = globalThis.chrome, Z = "https://calculating-gecko-263.convex.cloud", Q = n(Z), $ = ("cuelo-sidebar-" + Z).replace(/[^a-zA-Z0-9]/g, ""), et = a({
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
		let r = new Xe(Z, { logger: !1 });
		return n && r.setAuth(n), r.action(e === "signIn" ? $e.auth.signIn : $e.auth.signOut, t);
	},
	validate: async (e) => {
		let t = new Xe(Z, { logger: !1 });
		return t.setAuth(e), t.query($e.auth.isAuthenticated, {});
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
	if (!o(t, X.runtime.id, Z) || e.backend !== Z) {
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
	return et.run(r).then(n).catch(() => n({ error: "Cuelo could not update your sign-in. Check your connection and try again." })), !0;
}), X.storage.onChanged.addListener((e, t) => {
	t === "local" && e[Q] && (X.runtime.sendMessage({
		type: "shared-auth-changed",
		backend: Z
	}).catch(() => {}), X.tabs.query({}).then((e) => Promise.allSettled(e.filter((e) => {
		try {
			return i(new URL(e.url).origin, Z);
		} catch {
			return !1;
		}
	}).map((e) => X.tabs.sendMessage(e.id, {
		type: "shared-auth-changed",
		backend: Z
	})))).catch(() => {}));
}), X.runtime.onInstalled.addListener(() => {
	s(X, Z).catch(() => {});
}), s(X, Z).catch(() => {});
//#endregion
