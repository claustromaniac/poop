'use strict';

let storage;

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
					switch (msg.mode) {
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
				storage = msg.sync ? browser.storage.sync : browser.storage.local;
				ui.enabled.onchange = e => {
					storage.set({enabled: ui.enabled.checked});
				};
				const cb = e => {
					if (e.target.checked) {
						const change = {}
						change[ui.host.textContent] = +e.target.value;
						storage.set(change);
					}
				};
				ui.off.onchange = cb;
				ui.relaxed.onchange = cb;
				ui.aggressive.onchange = cb;
				ui.global.onchange = e => {
					if (ui.global.checked) storage.remove(ui.host.textContent);
				};
			} else {
				if (msg._host) {
					ui.host.textContent = msg._host;
					ui.altered.textContent = (msg._successes + msg._errors).toString();
					ui.errors.textContent = msg._errors.toString();
				}
			}
		});
		port.postMessage(tabs[0].id);
	});
});
