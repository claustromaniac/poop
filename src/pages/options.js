'use strict';

const ui = document.getElementsByTagName('*');

browser.storage.local.get({
	d1: false, d2: false, d3: false, d4: false, d5: false
}).then(r => {
	const cb = e => {
		setTimeout(e => {
			const val = {};
			val[e.target.id] = e.target.open;
			browser.storage.local.set(val);
		}, 500, e);
	};
	for (const i in r) {
		ui[i].open = r[i];
		ui[i].addEventListener('toggle', cb);
	}
});
browser.runtime.sendMessage(true).then(msg => {
	ui.exclusions.value = populateExclusions(msg.exclusions);
	ui.overrides.value = populateOverrides(msg.overrides);
	ui.relaxed.checked = msg.relaxed;
	ui.aggressive.checked = !msg.relaxed;
	ui.rdExclusions.checked = msg.rdExclusions;
	ui.referers.checked = msg.referers;
	for (const i in ui) {
		if (ui[i].className === 'srt') ui[i].checked = msg.strictTypes[ui[i].id];
	}
	ui.save.onclick = e => {
		const changes = Object.assign({}, msg);
		ui.saved.textContent = '. . .';
		ui.saved.className = 'shown';
		changes.exclusions = parseExclusions(ui.exclusions.value);
		changes.overrides = parseOverrides(ui.overrides.value);
		changes.relaxed = ui.relaxed.checked;
		changes.rdExclusions = ui.rdExclusions.checked;
		changes.referers = ui.referers.checked;
		for (const i in ui) {
			if (ui[i].className === 'srt') changes.strictTypes[ui[i].id] = ui[i].checked;
		}
		browser.storage.sync.clear()
		.then(browser.storage.local.set(changes))
		.then(() => {
			ui.saved.textContent = 'Saved!';
			setTimeout(() => {
				ui.saved.className = 'hidden';
			}, 2500);
		});
	};
});
