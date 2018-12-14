(() => {
	'use strict';
	const acao = {name: 'Access-Control-Allow-Origin', value: '*'};
	const filter = {urls: ["<all_urls>"]};
	const rIDs = {}; // tab objs by request ID
	const getRoot = host => {
		const parts = host.split('.');
		let root;
		while (parts.length) {
			root = parts.shift();
			if (publicSuffixes.has(parts.join('.'))) break;
		}
		return root;
	};

	browser.webRequest.onBeforeSendHeaders.addListener(d => {
		if (d.tabId === -1 || !d.requestHeaders) return;
		if (d.type === 'main_frame') {
			delete rIDs[d.requestId];
			delete tabs[d.tabId];
			return;
		}
		const info = tabs.getInfo(d.tabId);
		info.url = d.documentUrl;
		if (d.method !== 'GET' || !settings.enabled) return;
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
		if (mode === 2 || settings.strictTypes[d.type]) {
			for (const header of d.requestHeaders) {
				switch (header.name.toLowerCase()) {
					case 'origin':
						if (settings.rdExclusions) {
							info.root = info.root ? info.root : getRoot(info.host);
							if (getRoot(target.hostname) === info.root) {
								console.debug(
									`Privacy-Oriented Origin Policy: request #${d.requestId} skipped. Reason: root domains match\n${d.documentUrl}\n${d.url}`
								);
								return;
							}
						}
						origin = true;
						break;
					case 'referer':
						if (settings.referers) referer = {Referer: `${target.origin}/`};
						break;
					default:
						newHeaders.push(header);
				}
			}
		} else {
			for (const header of d.requestHeaders) {
				switch (header.name.toLowerCase()) {
					case 'cookie':
						return;
					case 'authorization':
						return;
					case 'origin':
						if (settings.rdExclusions) {
							info.root = info.root ? info.root : getRoot(info.host);
							if (getRoot(target.hostname) === info.root) {
								console.debug(
									`Privacy-Oriented Origin Policy: request #${d.requestId} skipped. Reason: root domains match\n${d.documentUrl}\n${d.url}`
								);
								return;
							}
						}
						origin = true;
						break;
					case 'referer':
						if (settings.referers) referer = {Referer: `${target.origin}/`};
						break;
					default:
						newHeaders.push(header);
				}
			}
		}
		if (origin) {
			if (referer) {
				newHeaders.push(referer);
				console.debug(
					`Privacy-Oriented Origin Policy: Referer spoofed (request #${d.requestId})\n${referer.value}\n${target.origin}/`
				);
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
				`Privacy-Oriented Origin Policy: altered request #${d.requestId} resulted in an error\n	type: ${d.type}\n	url: ${d.url}`
			);
			delete rIDs[d.requestId];
		}
	}, filter);
	browser.webRequest.onBeforeRedirect.addListener(d => {
		if (
			rIDs[d.requestId] &&
			d.redirectUrl &&
			~d.redirectUrl.indexOf('data://')
		) delete rIDs[d.requestId];
	}, filter);
})();
