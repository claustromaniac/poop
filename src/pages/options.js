'use strict';

document.addEventListener('DOMContentLoaded', () => {
	browser.runtime.sendMessage(true).then(settings => {
		const ui = getElements([
			'sync', 'relaxed', 'aggressive', 'font', 'image',
			'media', 'script', 'stylesheet', 'xhr'
		]);
		ui.sync.checked = settings.sync;
		ui.relaxed.checked = settings.relaxed;
		ui.aggressive.checked = !settings.relaxed;
		ui.font.checked = settings.strictTypes.font;
		ui.image.checked = settings.strictTypes.image;
		ui.media.checked = settings.strictTypes.media;
		ui.script.checked = settings.strictTypes.script;
		ui.stylesheet.checked = settings.strictTypes.stylesheet;
		ui.xhr.checked = settings.strictTypes.xmlhttprequest;
		document.querySelector("form").addEventListener("submit", e => {
			e.preventDefault();
			settings.sync = ui.sync.checked;
			settings.relaxed = ui.relaxed.checked;
			settings.strictTypes.font = ui.font.checked;
			settings.strictTypes.image = ui.image.checked;
			settings.strictTypes.media = ui.media.checked;
			settings.strictTypes.script = ui.script.checked;
			settings.strictTypes.stylesheet = ui.stylesheet.checked;
			settings.strictTypes.xmlhttprequest = ui.xhr.checked;
			settings.sync ? browser.storage.sync.set(settings) : browser.storage.sync.clear().then(browser.storage.local.set(settings));;
		});
	});
});
