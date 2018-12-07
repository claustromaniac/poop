class Settings {
	constructor() {
		this.defaults = {
			'enabled': true,
			'relaxed': true,	//false = aggressive
			'overrides': {},	//host-specific overrides: 0=whitelisted, 1=relaxed, 2=aggressive
			'strictTypes': {
				'font': true,
				'image': false,
				'imageset': false,
				'media': false,
				'object': false,
				'object_subrequest': false,
				'other': false,
				'script': false,
				'stylesheet': true,
				'websocket': false,
				'xmlhttprequest': false
			}
		};
		this.loading = (async () => {
			let saved = await browser.storage.local.get(this.defaults);
			this.all = saved;
			await browser.storage.local.set(saved);
			browser.storage.onChanged.addListener((changes, area) => {
				console.log(`Privacy-Oriented Origin Policy: ${area} storage changed`);
				for (const i in changes) {
					if (changes[i].hasOwnProperty('newValue')) this[i] = changes[i].newValue;
					else if (changes[i].hasOwnProperty('oldValue')) delete this[i];
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
		if (settings.overrides.hasOwnProperty(this.host)) return settings.overrides[this.host];
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
}

class Popup {
	refresh(id) {
		if (this.id !== id) return;
		const tab = tabs.getInfo(id);
		if (this.host === tab.host) this.port.postMessage(tab);
		else this.sendAll(tab);
	}
	sendAll(tab) {
		this.port.postMessage({
			_errors: tab.errors,
			_host: tab.host,
			_successes: tab.successes,
			enabled: settings.enabled,
			overrides: settings.overrides
		});
	}
	start(id, port) {
		this.id = id;
		this.port = port;
		port.onDisconnect.addListener(p => {
			delete this.id;
			delete this.port;
			delete this.host;
		});
		const tab = tabs.getInfo(id);
		this.host = tab.host;
		this.sendAll(tab);
	}
}
