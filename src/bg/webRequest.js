(() => {
	'use strict';
	const acao = {name: 'Access-Control-Allow-Origin', value: '*'};
	const filter = {urls: ["<all_urls>"]};
	const rIDs = {}; // tab objs by request ID
	const getRoot = host => {
		const parts = host.split('.');
		let root;
		while (parts.length > 1) {
			root = parts.shift();
			if (publicSuffixes.has(parts.join('.'))) break;
		}
		return root;
	};
	const isExcluded = (origin, target) => {
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
	};

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
				target.searchParams ||
				target.hash ||
				target.username ||
				target.password
			)
		) return;

		const newHeaders = [];
		let origin;
		let referer;
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
					origin = true;
					break;
				case 'authorization':
					if (mode === 1 && !settings.strictTypes[d.type]) return;
					newHeaders.push(header);
					break;
				case 'access-control-request-method':
					if (d.method === 'OPTIONS' && header.value !== 'GET') return;
					newHeaders.push(header);
					break;
				default:
					newHeaders.push(header);
			}
		}
		if (origin) {
			if (referer) {
				if (settings.referers) {
					newHeaders.push({name:'Referer', value:`${d.url}`});
					console.debug(
						`Privacy-Oriented Origin Policy: Referer spoofed (request #${d.requestId})\n${d.url}`
					);
				} else newHeaders.push(referer);
			}
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
})();
