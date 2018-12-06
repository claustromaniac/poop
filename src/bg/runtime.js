browser.runtime.onConnect.addListener(port => {
	// triggered by popup script
	port.onMessage.addListener(msg => {
		port.postMessage(tabs.getPopupInfo(msg));
	});
});

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	// triggered by options page script
	return settings.all;
});
