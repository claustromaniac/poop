'use strict';

const hostrx = /^\s*(\S+\.\S+)\s*$/;
const valrx = /^\s*([0-2])\s*$/;

function getElements(ids) {
	const result = {};
	for (const id of ids) result[id] = document.getElementById(id);
	return result;
}

function parseList(text) {
	const obj = {};
	for (const entry of text.split(',')) {
		const pair = entry.split('=');
		if (
			pair.length !== 2 ||
			!hostrx.test(pair[0]) ||
			!valrx.test(pair[1])
		) continue;
		pair[0] = pair[0].replace(hostrx, '$1');
		pair[1] = pair[1].replace(valrx, '$1');
		obj[pair[0]] = +pair[1];
	}
	return obj;
}

function genList (obj) {
	const arr = [];
	for (const i in obj) arr.push(`${i}=${obj[i]}`);
	return arr.sort().join(', ');
}
