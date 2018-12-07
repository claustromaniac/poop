'use strict';

function getElements(ids) {
	const result = {};
	for (const id of ids) {
		result[id] = document.getElementById(id)
	}
	return result;
}

