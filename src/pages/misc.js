'use strict';

function getElements(ids) {
	const result = {};
	for (const id of ids) result[id] = document.getElementById(id);
	return result;
}

const overriderx = /^([0-2])::?(\S+)$/;
const exclusionrx = /^\s*(\S+)[ \t]+(\S+)\s*$/;

function parseOverrides(str) {
	const result = [];
	str.split(/,\s+|\r?\n/).reverse().forEach(e => {
		e = e.replace(/\s+/g, '');
		const pattern = e.replace(overriderx, '$2');
		if (pattern == e) return;
		const override = {
			mode: +e.replace(overriderx, '$1'),
			rule: pattern
		};
		if (e.substring(2, 3) == ':') override.regex = pattern;
		else if (override.rule.includes('*')) override.regex = wildcard2rx('(?:[^:\\s]+:/*)?', pattern);
		result.push(override);
	});
	return result;
}

function populateOverrides(arr) {
	return arr.reverse().map(e => {
		return `${e.mode}: ${e.rule}`;
	}).join('\n');
}

function parseExclusions(str) {
	const result = [];
	str.split(/,\s+|\r?\n/).reverse().forEach(e => {
		const target = e.replace(exclusionrx, '$2');
		if (target == e) return;
		const origin = e.replace(exclusionrx, '$1');
		const exclusion = {rule: e};
		exclusion.origin = origin.includes('*') ? wildcard2rx('', origin) : origin;
		exclusion.target = target.includes('*') ? wildcard2rx('', target) : target;
		result.push(exclusion);
	});
	return result;
}

function populateExclusions(arr) {
	return arr.reverse().map(e => {
		return e.rule;
	}).join('\n');
}

function wildcard2rx(prefix, str) {
	return '^' + prefix + str.split(/\*+/).map(e => {
		return e.replace(/[.*?$+^|\\{}()[\]]/g, '\\$&');
	}).join('.*') + '$';
}
