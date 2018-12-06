(() => {
	'use strict';
	const acao = {name: 'Access-Control-Allow-Origin', value: '*'};
	const filter = {urls: ["<all_urls>"]};
	const rIDs = {}; // tab objs by request ID
	const queryrx = /^[^:]+:\/*[^/:]+\/[^?]*\?./; //regex for detecting url query

	browser.webRequest.onBeforeSendHeaders.addListener(d => {
		if (d.tabId === -1 || !d.requestHeaders || d.method !== 'GET') return;
		if (d.type === 'main_frame') {
			delete rIDs[d.requestId];
			delete tabs[d.tabId];
			return;
		}
		const info = tabs.getInfo(d.tabId);
		info.host = d.documentUrl;
		const mode = info.mode;
		if (
			!mode || (
				!settings.strictTypes[d.type] && (
					mode === 1 && queryrx.test(d.url)
				)
			)
		) return;

		const newHeaders = [];
		let origin = false;
		if (mode === 2 || settings.strictTypes[d.type]) {
			for (const header of d.requestHeaders) {
				if (header.name.toLowerCase() === 'origin') origin = true;
				else newHeaders.push(header);
			}
		} else {
			for (const header of d.requestHeaders) {
				switch (header.name.toLowerCase()) {
					case 'cookie':
						return;
					case 'authorization':
						return;
					case 'origin':
						origin = true;
						break;
					default:
						newHeaders.push(header);
				}
			}
		}
		if (origin) {
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
			console.log(
				`Privacy-Oriented Origin Policy: request #${d.requestId} successfully altered\n	type: ${d.type}\n	url: ${d.url}`
			);
			delete rIDs[d.requestId];
		}
	}, filter);
	browser.webRequest.onErrorOccurred.addListener(d => {
		if (rIDs[d.requestId]) {
			rIDs[d.requestId].errors++;
			console.log(
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
