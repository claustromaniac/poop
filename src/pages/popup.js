'use strict';

let started = false;
let storage;

document.addEventListener('DOMContentLoaded', () => {
	const ui = getElements([
		'enabled', 'host', 'altered', 'errors', 'global', 'aggressive', 'relaxed', 'off'
	]);
	onPoll(msg => {
		if (started) {
			if (msg.host) {
				ui.host.textContent = msg.host;
				ui.altered.textContent = (msg.successes + msg.errors).toString();
				ui.errors.textContent = msg.errors.toString();
			}
		} else {
			ui.enabled.checked = msg.enabled;
			if (msg.host) {
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
			const mc = (o, n) => {
				if(o.checked) {
					const c = {};
					c[ui.host.textContent] = n;
					storage.set(c);
				}
			};
			ui.off.onchange = e => {
				mc(ui.off, 0);
			};
			ui.relaxed.onchange = e => {
				mc(ui.relaxed, 1);
			};
			ui.aggressive.onchange = e => {
				mc(ui.aggressive, 2);
			};
			ui.global.onchange = e => {
				if (ui.global.checked) storage.remove(ui.host.textContent);
			};
			started = true;
		}
	}, 1000);
});
