'use strict';

browser.runtime.onConnect.addListener(port => {
	port.onMessage.addListener(msg => {
		popup.start(msg, port);
	});
});

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	// triggered by options page script
	return settings.all;
});
