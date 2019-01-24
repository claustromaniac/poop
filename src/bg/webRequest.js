'use strict';

/** ---------- Functions ---------- **/

function IPinRange(ip, min, max) {
	for (const i in ip) {
		if (ip[i] < min[i] || ip[i] > max[i]) return;
	}
	return true;
}

function isReservedAddress(str) {
	const addr = str.split('.');
	if (addr.length !== 4) return addr.length == 1; // no dots = loopback or the like
	for (const part of addr) {
		if (Number.isNaN(+part) || part < 0 || part > 255) return;
	}
	return (
		IPinRange(addr, [10,0,0,0], [10,255,255,255]) ||
		IPinRange(addr, [100,64,0,0], [100,127,255,255]) ||
		IPinRange(addr, [127,0,0,0], [127,255,255,255]) ||
		IPinRange(addr, [169,254,0,0], [169,254,255,255]) ||
		IPinRange(addr, [172,16,0,0], [172,31,255,255]) ||
		IPinRange(addr, [192,0,0,0], [192,0,0,255]) ||
		IPinRange(addr, [192,168,0,0], [192,168,255,255]) ||
		IPinRange(addr, [198,18,0,0], [198,19,255,255])
	);
}

function getRoot(host) {
	const parts = host.split('.');
	let root;
	while (parts.length > 1) {
		const previous = root;
		root = parts.shift();
		const suffix = parts.join('.');
		if (publicSuffixes.has(suffix)) break;
		if (publicSuffixes.has(`*.${suffix}`)) {
			root = previous;
			break;
		}
	}
	return root;
}

function isExcluded(origin, target) {
	const arr = settings.exclusions;
	for (const e of arr) {
		if (e.origin.includes('*')) {
			const rx = new RegExp(e.origin);
			if (!rx.test(origin)) continue;
		} else if (e.origin !== origin) continue;
		if (e.target.includes('*')) {
			const rx = new RegExp(e.target);
			if (!rx.test(target)) continue;
		} else if (e.target !== target) continue;
		return true;
	}
}

/** ------------------------------ **/

const acao = {name: 'Access-Control-Allow-Origin', value: '*'};
const filter = {urls: ["<all_urls>"]};
const rIDs = {}; // tab objs by request ID

browser.webRequest.onBeforeSendHeaders.addListener(d => {
	if (d.tabId === -1 || !d.requestHeaders) return;
	if (d.type === 'main_frame') {
		delete rIDs[d.requestId];
		delete tabs[d.tabId];
		const info = tabs.getInfo(d.tabId);
		info.url = d.url;
		return;
	}
	if (
		(d.method !== 'GET' && d.method !== 'OPTIONS') ||
		!settings.enabled
	) return;
	const info = tabs.getInfo(d.tabId);
	const mode = info.getMode();
	if (!mode) return;
	const target = new URL(d.url);
	if (
		mode === 1 &&
		!settings.strictTypes[d.type] && (
			target.searchParams.toString() ||
			target.hash ||
			target.username ||
			target.password
		) || isReservedAddress(target.hostname)
	) return;

	const newHeaders = [];
	let origin;
	let referer;
	let acrm; // Access-Control-Request-Method
	for (const header of d.requestHeaders) {
		switch (header.name.toLowerCase()) {
			case 'cookie':
				if (mode === 1 && !settings.strictTypes[d.type]) return;
				newHeaders.push(header);
				break;
			case 'referer':
				referer = header;
				break;
			case 'origin':
				if (settings.rdExclusions) {
					const temp = (new URL(header.value)).hostname;
					if (getRoot(temp) === getRoot(target.hostname)) {
						console.debug(
							`Privacy-Oriented Origin Policy: request #${d.requestId} skipped. Reason: root domains match\n${header.value}\n${d.url}`
						);
						return;
					}
				}
				if (settings.exclusions.length) {
					const temp = (new URL(header.value)).hostname;
					if (isExcluded(temp, target.hostname)) {
						console.debug(
							`Privacy-Oriented Origin Policy: request #${d.requestId} skipped. Reason: exclusion rule matched`
						);
						return;
					}
				}
				origin = `Origin ${header.value}`;
				break;
			case 'authorization':
				if (mode === 1 && !settings.strictTypes[d.type]) return;
				newHeaders.push(header);
				break;
			case 'access-control-request-method':
				if (header.value !== 'GET') return;
				acrm = true;
				newHeaders.push(header);
				break;
			default:
				newHeaders.push(header);
		}
	}
	if (origin) {
		if (d.method == 'OPTIONS' && !acrm) return;
		if (referer) {
			if (settings.referers) {
				newHeaders.push({name:'Referer', value:`${d.url}`});
				console.debug(
					`Privacy-Oriented Origin Policy: Referer spoofed (request #${d.requestId})\n${d.url}`
				);
			} else newHeaders.push(referer);
		}
		console.debug(`Privacy-Oriented Origin Policy: ${origin} removed from request #${d.requestId}`);
		rIDs[d.requestId] = info;
		return {requestHeaders: newHeaders};
	}
}, filter, ['blocking', 'requestHeaders']);

browser.webRequest.onHeadersReceived.addListener(d => {
	if (!rIDs[d.requestId] || !d.responseHeaders) return;
	const newHeaders = [];
	for (const header of d.responseHeaders) {
		if (header.name.toLowerCase() !== 'access-control-allow-origin') {
			newHeaders.push(header);
		}
	}
	newHeaders.push(acao);
	return {responseHeaders: newHeaders};
}, filter, ['blocking', 'responseHeaders']);

browser.webRequest.onCompleted.addListener(d => {
	if (rIDs[d.requestId]) {
		rIDs[d.requestId].successes++;
		console.debug(
			`Privacy-Oriented Origin Policy: request #${d.requestId} successfully altered\n	type: ${d.type}\n	url: ${d.url}`
		);
		delete rIDs[d.requestId];
	}
}, filter);
browser.webRequest.onErrorOccurred.addListener(d => {
	if (rIDs[d.requestId]) {
		rIDs[d.requestId].errors++;
		console.debug(
			`Privacy-Oriented Origin Policy: request #${d.requestId} resulted in an error\n	type: ${d.type}\n	url: ${d.url}`
		);
		delete rIDs[d.requestId];
	}
}, filter);
browser.webRequest.onBeforeRedirect.addListener(d => {
	if (
		rIDs[d.requestId] &&
		d.redirectUrl &&
		!d.redirectUrl.indexOf('data:')
	) delete rIDs[d.requestId];
}, filter);
