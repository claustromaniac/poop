'use strict';

browser.tabs.onRemoved.addListener((tabId, removeInfo) => { delete tabs[tabId] });
browser.tabs.onReplaced.addListener((newId, oldId) => { delete tabs[oldId] });
