'use strict';

function getElements(ids) {
	const result = {};
	for (const id of ids) result[id] = document.getElementById(id);
	return result;
}

const entryrx = /^([0-2])::?(\S+)$/;
const wildcardrx = /^(?!:).*\*/;

function parseList(str) {
	const result = [];
	str.split(/,\s+|\r?\n/).reverse().forEach(e => {
		e = e.replace(/\s+/g, '');
		const pattern = e.replace(entryrx, '$2');
		if (pattern == e) return;
		const override = {
			mode: +e.replace(entryrx, '$1'),
			rule: pattern
		};
		if (e.substring(2, 3) == ':') override.regex = pattern;
		else if (override.rule.includes('*')) override.regex = wildcard2rx(pattern);
		result.push(override);
	});
	return result;
}

function genList(arr) {
	return arr.reverse().map(e => {
		return `${e.mode}: ${e.rule}`;
	}).join('\n');
}

function wildcard2rx(str) {
	return '^(?:[^:\\s]+:/*)?' + str.split(/\*+/).map(e => {
		return e.replace(/[.*?$+^|\\{}()[\]]/g, '\\$&');
	}).join('.*') + '$';
}
