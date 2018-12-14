'use strict';
var settings;
document.addEventListener('DOMContentLoaded', e => {
	const ui = getElements([
		'relaxed', 'aggressive', 'overrides', 'rdExclusions',
		'referers', 'save', 'saved'

	]);
	const srt = document.getElementsByClassName('srt');
	browser.runtime.sendMessage(true).then(msg => {
		settings = msg;
		ui.overrides.value = genList(msg.overrides);
		ui.relaxed.checked = msg.relaxed;
		ui.aggressive.checked = !msg.relaxed;
		ui.rdExclusions.checked = msg.rdExclusions;
		ui.referers.checked = msg.referers;
		for (const i in srt) srt[i].checked = msg.strictTypes[srt[i].id];
	});
	ui.save.onclick = e => {
		ui.saved.textContent = '. . .';
		ui.saved.className = 'shown';
		settings.overrides = parseList(ui.overrides.value);
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
