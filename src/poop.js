(() => {
	'use strict';
	const requestsByID = {};
	const filter = {urls: ["<all_urls>"]};

	browser.webRequest.onBeforeSendHeaders.addListener(d => {
		if (!d.requestHeaders || d.method !== 'GET') return;
		const newHeaders = [];
		let origin = false;
		let unsafe = false;
		for (const header of d.requestHeaders) {
			switch (header.name.toLowerCase()) {
				case 'origin':
					origin = header.value;
					break;
				case 'cookie':
					unsafe = true;
				default:
					newHeaders.push(header);
			}
		}
		if (origin) {
			if (unsafe) newHeaders.push({name: 'Origin', value: origin});
			else requestsByID[d.requestId] = true;
		}
		return {requestHeaders: newHeaders};
	}, filter, ['blocking', 'requestHeaders']);

	browser.webRequest.onHeadersReceived.addListener(d => {
		if (!requestsByID[d.requestId] || !d.responseHeaders || d.method !== 'GET') return;
		const newHeaders = [];
		for (const header of d.responseHeaders) {
			if (header.name.toLowerCase() !== 'access-control-allow-origin') {
				newHeaders.push(header);
			}
		}
		newHeaders.push({name: 'Access-Control-Allow-Origin', value: '*'});
		console.log(
			`private-origin: request ${d.requestId} successfully altered\n	type: ${d.type}\n	url: ${d.url}`
		);
		return {responseHeaders: newHeaders};
	}, filter, ['blocking', 'responseHeaders']);

	const clear = d => {
		if (requestsByID[d.requestId]) delete requestsByID[d.requestId];
	};
	browser.webRequest.onCompleted.addListener(clear, filter);
	browser.webRequest.onErrorOccurred.addListener(clear, filter);
	browser.webRequest.onBeforeRedirect.addListener(d => {
		if (d.redirectUrl && ~d.redirectUrl.indexOf('data://')) clear(d);
	}, filter);
})();
