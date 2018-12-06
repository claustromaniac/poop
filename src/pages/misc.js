'use strict';

function getElements(ids) {
	'use strict';
	const result = {};
	for (const id of ids) {
		result[id] = document.getElementById(id)
	}
	return result;
}

function onPoll(cb, interval) {
	browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
		const port = browser.runtime.connect();
		window.addEventListener('unload', function(event) {
			port.disconnect();
		});
		port.onMessage.addListener(msg => {
			cb(msg);
			window.setTimeout(() => {port.postMessage(tabs[0].id)}, interval);
		});
		port.postMessage(tabs[0].id);
	});
}
