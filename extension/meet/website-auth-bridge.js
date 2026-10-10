//#region src/auth/sharedSession.ts
function e(e, t) {
	return e === t.replace(".convex.cloud", ".convex.site") || t.includes("calculating-gecko-263") && e === "http://127.0.0.1:5173";
}
//#endregion
//#region extension/src/websiteAuthBridge.ts
var t = globalThis.chrome, n = "https://calculating-gecko-263.convex.cloud";
window === window.top && e(location.origin, n) && (window.addEventListener("message", (e) => {
	let r = e.data;
	if (e.source === window && e.origin === location.origin && r?.channel === "cuelo-auth-request" && r.backend === n && typeof r.id == "string" && /^[a-f0-9]{32}$/.test(r.id)) {
		if (r.request?.operation === "probe") {
			window.postMessage({
				channel: "cuelo-auth-reply",
				id: r.id,
				backend: n,
				result: { state: {
					token: null,
					revision: -1,
					established: !1
				} }
			}, location.origin);
			return;
		}
		t.runtime.sendMessage({
			type: "shared-auth",
			backend: n,
			request: r.request
		}).then((e) => window.postMessage({
			channel: "cuelo-auth-reply",
			id: r.id,
			backend: n,
			result: e
		}, location.origin)).catch(() => window.postMessage({
			channel: "cuelo-auth-reply",
			id: r.id,
			backend: n,
			result: { error: "Cuelo extension disconnected. Reload this page." }
		}, location.origin));
	}
}), t.runtime.onMessage.addListener((e) => {
	e?.type === "shared-auth-changed" && e.backend === n && window.postMessage({
		channel: "cuelo-auth-changed",
		backend: n
	}, location.origin);
}));
//#endregion
