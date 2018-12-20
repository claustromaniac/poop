'use strict';
var settings;
document.addEventListener('DOMContentLoaded', e => {
	const ui = getElements([
		'relaxed', 'aggressive', 'd1', 'd2', 'd3', 'd4', 'd5', 'exclusions',
		'overrides', 'rdExclusions', 'referers', 'save', 'saved'
	]);
	const srt = document.getElementsByClassName('srt');
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
		settings = msg;
		ui.exclusions.value = populateExclusions(msg.exclusions);
		ui.overrides.value = populateOverrides(msg.overrides);
		ui.relaxed.checked = msg.relaxed;
		ui.aggressive.checked = !msg.relaxed;
		ui.rdExclusions.checked = msg.rdExclusions;
		ui.referers.checked = msg.referers;
		for (const i in srt) srt[i].checked = msg.strictTypes[srt[i].id];
	});
	ui.save.onclick = e => {
		ui.saved.textContent = '. . .';
		ui.saved.className = 'shown';
		settings.exclusions = parseExclusions(ui.exclusions.value);
		settings.overrides = parseOverrides(ui.overrides.value);
		settings.relaxed = ui.relaxed.checked;
		settings.rdExclusions = ui.rdExclusions.checked;
		settings.referers = ui.referers.checked;
		for (const i in srt) settings.strictTypes[srt[i].id] = srt[i].checked;
		browser.storage.sync.clear()
		.then(browser.storage.local.set(settings))
		.then(() => {
			ui.saved.textContent = 'Saved!';
			setTimeout(() => {
				ui.saved.className = 'hidden';
			}, 2500);
		});
	};
});
