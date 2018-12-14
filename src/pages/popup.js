'use strict';

document.addEventListener('DOMContentLoaded', () => {
	const ui = getElements([
		'enabled', 'host', 'altered', 'errors', 'global', 'aggressive',
		'aggressiveL', 'relaxed', 'relaxedL', 'off', 'offL'
	]);
	browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
		const port = browser.runtime.connect();
		window.addEventListener('unload', function(event) {
			port.disconnect();
		});
		port.onMessage.addListener(msg => {
			if (msg.hasOwnProperty('enabled')) {
				ui.enabled.checked = msg.enabled;
				if (msg.host) {
					ui.host.textContent = msg.host;
					ui.altered.textContent = (msg._successes + msg._errors).toString();
					ui.errors.textContent = msg._errors.toString();
					ui.off.disabled = false;
					ui.relaxed.disabled = false;
					ui.aggressive.disabled = false;
					delete ui.offL.className;
					delete ui.relaxedL.className;
					delete ui.aggressiveL.className;
					if (msg.oIndex === -1 || msg.overrides[msg.oIndex].regex) ui.global.checked = true;
					if (~msg.oIndex) {
						const isRegex = msg.overrides[msg.oIndex].regex && ui.global.checked;
						switch (msg.mode) {
							case 0:
								isRegex ? ui.offL.className = 'rxMatch' : ui.off.checked = true;
								break;
							case 1:
								isRegex ? ui.relaxedL.className = 'rxMatch' : ui.relaxed.checked = true;
								break;
							case 2:
								isRegex ? ui.aggressiveL.className = 'rxMatch' : ui.aggressive.checked = true;
						}
					}
				}
				ui.enabled.onchange = e => {
					browser.storage.local.set({enabled: ui.enabled.checked});
				};
				const cb = e => {
					if (e.target.checked) {
						const override = {
							rule: msg.host,
							mode: +e.target.value
						};
						if (msg.overrides[msg.oIndex].regex) {
							browser.storage.local.set({
								overrides: [override].concat(msg.overrides)
							});
						} else {
							browser.storage.local.set({
								overrides: [override].concat(msg.overrides.filter((l,i) => {
									return l && i !== msg.oIndex
								}))
							});
						}
					}
				};
				ui.off.onchange = cb;
				ui.relaxed.onchange = cb;
				ui.aggressive.onchange = cb;
				ui.global.onchange = e => {
					if (ui.global.checked && msg.oIndex !== -1) {
						browser.storage.local.set({
							overrides: msg.overrides.filter((l,i) => {
								return l && i !== msg.oIndex
							})
						});
					}
				};
			} else {
				ui.host.textContent = msg.host;
				ui.altered.textContent = (msg._successes + msg._errors).toString();
				ui.errors.textContent = msg._errors.toString();
			}
		});
		port.postMessage(tabs[0].id);
	});
});
