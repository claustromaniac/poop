class Settings {
	constructor() {
		this.defaults = {
			'enabled': true,
			'relaxed': true, //false = aggressive //host-specific overrides: 0=whitelisted, 1=relaxed, 2=aggressive
			'strictTypes': {
				'font': true,
				'image': false,
				'media': false,
				'script': false,
				'stylesheet': true,
				'xmlhttprequest': false
			},
			'sync': false
		};
		this.loading = (async () => {
			let saved = await browser.storage.local.get(this.defaults);
			saved = await browser.storage.sync.get(saved);
			this.all = saved;
			if (this.sync) await browser.storage.sync.set(saved);
			else await browser.storage.sync.clear();
			await browser.storage.local.set(saved);
			browser.storage.onChanged.addListener((changes, area) => {
				console.log(`Privacy-Oriented Origin Policy: ${area} storage changed`);
				if (area === 'sync' && !this.sync) return;
				for (const i in changes) {
					if (changes[i].hasOwnProperty('newValue')) this[i] = changes[i].newValue;
					else if (changes[i].hasOwnProperty('oldValue')) delete this[i];
				}
				if (area === 'sync') {
					browser.storage.local.clear().then(this.all).then(r => {
						browser.storage.local.set(r);
					});
				}
			});
			console.log('Privacy-Oriented Origin Policy: settings loaded');
			delete this.loading;
		})();
	}
	get all() {
		return (async () => {
			if (this.loading) await this.loading;
			const val = {};
			for (const i in this.defaults) val[i] = this[i];
			return val;
		})();
	}
	set all(obj) {
		for (const i in obj) this[i] = obj[i];
	}
}

class TabInfo {
	constructor(id) {
		this._errors = 0;
		this._host = '';
		this._successes = 0;
		this.id = id;
	}
	set successes(num) {
		if (num > this._successes) {
			this._successes = num;
			this.updateBadge();
			return num;
		}
	}
	get successes() {
		return this._successes;
	}
	set errors(num) {
		if (num > this._errors) {
			this._errors = num;
			this.updateBadge();
			return num;
		}
	}
	get errors() {
		return this._errors;
	}
	set host(url) {
		if (this._host) return this._host;
		return this._host = url.replace(/^[^:]+:\/*([^/:]+).*$/, '$1');
	}
	get host() {
		return this._host;
	}
	set mode(n) {
		return settings[this.host] = n;
	}
	get mode() {
		if (settings.hasOwnProperty(this.host)) return settings[this.host];
		return settings.relaxed ? 1 : 2;
	}
	updateBadge() {
		popup.refresh(this.id);
		const c = this._errors ? 'darkred' : 'darkgreen';
		browser.browserAction.setBadgeBackgroundColor({
			color: c,
			tabId: this.id
		});
		const n = this._errors + this._successes;
		if (n) {
			browser.browserAction.setBadgeText({
				text: n.toString(),
				tabId: this.id
			});
		}
	}
}

class Tabs {
	getInfo(id) {
		if (!this[id]) this[id] = new TabInfo(id);
		return this[id];
	}
	getPopupInfo(id) {
		return {
			enabled: settings.enabled,
			errors: this[id]._errors,
			host: this[id]._host,
			mode: settings[(this[id].host)],
			successes: this[id]._successes,
			sync: settings.sync
		};
	}
}

class Popup {
	refresh(id) {
		if (this.id !== id) return;
		this.port.postMessage(tabs[id]);
	}
	start(id, port) {
		this.id = id;
		this.port = port;
		port.onDisconnect.addListener(p => {
			delete this.id;
			delete this.port;
		});
		const tab = tabs.getInfo(id);
		port.postMessage({
			_errors: tab.errors,
			_host: tab.host,
			_successes: tab.successes,
			enabled: settings.enabled,
			mode: settings[(tab.host)],
			sync: settings.sync
		});
	}
}
