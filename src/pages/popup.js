'use strict';

document.addEventListener('DOMContentLoaded', () => {
	const ui = getElements([
		'enabled', 'host', 'altered', 'errors', 'global', 'aggressive', 'relaxed', 'off'
	]);
	browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
		const port = browser.runtime.connect();
		window.addEventListener('unload', function(event) {
			port.disconnect();
		});
		port.onMessage.addListener(msg => {
			if (msg.hasOwnProperty('enabled')) {
				ui.enabled.checked = msg.enabled;
				if (msg._host) {
					ui.host.textContent = msg._host;
					ui.altered.textContent = (msg._successes + msg._errors).toString();
					ui.errors.textContent = msg._errors.toString();
					ui.off.disabled = false;
					ui.relaxed.disabled = false;
					ui.aggressive.disabled = false;
					switch (msg.overrides[msg._host]) {
						case 0:
							ui.off.checked = true;
							break;
						case 1:
							ui.relaxed.checked = true;
							break;
						case 2:
							ui.aggressive.checked = true;
							break;
						default:
							ui.global.checked = true;
					}
				}
				ui.enabled.onchange = e => {
					browser.storage.local.set({enabled: ui.enabled.checked});
				};
				const cb = e => {
					if (e.target.checked) {
						msg.overrides[msg._host] = +e.target.value;
						browser.storage.local.set({overrides: msg.overrides});
					}
				};
				ui.off.onchange = cb;
				ui.relaxed.onchange = cb;
				ui.aggressive.onchange = cb;
				ui.global.onchange = e => {
					if (ui.global.checked) {
						delete msg.overrides[msg._host];
						browser.storage.local.set({overrides: msg.overrides});
					}
				};
			} else {
				ui.host.textContent = msg._host;
				ui.altered.textContent = (msg._successes + msg._errors).toString();
				ui.errors.textContent = msg._errors.toString();
			}
		});
		port.postMessage(tabs[0].id);
	});
});
