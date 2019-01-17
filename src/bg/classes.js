class Settings {
	constructor() {
		this.defaults = {
			'enabled': true,
			'exclusions': [],
			'rdExclusions': false,
			'referers': true,
			'relaxed': true,	//false = aggressive
			'overrides': [],	//host-specific overrides: 0=whitelisted, 1=relaxed, 2=aggressive
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
			const local = browser.storage.local;
			let saved = await local.get(this.defaults);
			if (!Array.isArray(saved.overrides)) saved.overrides = [];
			this.all = saved;
			await local.set(saved);
			browser.storage.onChanged.addListener((changes, area) => {
				console.debug(`Privacy-Oriented Origin Policy: ${area} storage changed`);
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
		tabs.wipeInfoCaches();
	}
	set enabled(bool) {
		if (this._enabled === !!bool) return this._enabled;
		if (bool) {
			browser.browserAction.setBadgeBackgroundColor({color: null});
			browser.browserAction.setBadgeText({text: null});
		} else {
			browser.browserAction.setBadgeBackgroundColor({color: '#999'});
			browser.browserAction.setBadgeText({text: 'off'});
		}
		return this._enabled = !!bool;
	}
	get enabled() {
		return this._enabled;
	}
}

class TabInfo {
	constructor(id) {
		this._errors = 0;
		this._successes = 0;
		this.id = id;
		this.oIndex = -1;
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
	set url(str) {
		if (str !== this._url) {
			this._url = str;
			this.host = (new URL(str)).hostname;
			popup.refresh(this.id);
		}
		return str;
	}
	getMode() {
		if (this.hasOwnProperty('mode')) return this.mode;
		if (this._url) {
			this.oIndex = settings.overrides.findIndex(o => {
				if (!o) return;
				if (o.rule === this.host || o.rule === this._url) return true;
				if (o.regex) {
					const rx = new RegExp(o.regex);
					return (
						o.rule.includes('*') && (
							(
								o.rule.includes('/') ||
								!o.rule.includes('.')
							) && rx.test(this._url)
						) || rx.test(this.host)
					) || rx.test(this._url);
				}
			});
			if (this.oIndex !== -1) return this.mode = settings.overrides[this.oIndex].mode;
			return this.mode = settings.relaxed ? 1 : 2;
		}
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
	wipeInfoCaches() {
		for (const i in this) delete this[i].mode;
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
		delete tab.mode;
		this.host = tab.host;
		this.port.postMessage({
			_errors: tab.errors,
			_successes: tab.successes,
			enabled: settings.enabled,
			host: tab.host,
			mode: tab.getMode(),
			oIndex: tab.oIndex,
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
		this.sendAll(tab);
	}
}
