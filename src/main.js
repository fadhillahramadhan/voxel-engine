import VoxelEditor from './VoxelEditor.js';

document.addEventListener('DOMContentLoaded', () => {
	const editor = new VoxelEditor();
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ENVIRONMENT = import.meta.env.ENVIRONMENT;

// Utility functions
const toggleElementVisibility = (selector, isVisible) => {
	const element = document.querySelector(selector);
	element.style.display = isVisible ? 'block' : 'none';
};

const fetchJSON = async (url, options = {}) => {
	const response = await fetch(url, options);
	return response.json();
};

// Manage URL parameters and local storage
const handleUrlParams = () => {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has('code')) {
		localStorage.clear();
		const code = urlParams.get('code');
		const action = urlParams.get('a');
		localStorage.setItem('c', action);
		localStorage.setItem('code', code);
		window.history.replaceState({}, document.title, '/');
		loadVoxels(code);
	}
};

const loadVoxels = async (code) => {
	const url =
		ENVIRONMENT !== 'local'
			? `${API_BASE_URL}/modeling/get?unique_code=${code}`
			: `/server/custom_models/${code}.json`;

	const data = await fetchJSON(url);
	localStorage.setItem('voxels', JSON.stringify(data.data || data));
	location.reload();
};

// Save model data
const saveModel = async () => {
	const voxels = JSON.parse(localStorage.getItem('voxels'));
	const code = localStorage.getItem('code');
	const canvas = document.querySelector('canvas');
	const img = canvas.toDataURL('image/png');

	const payload = {
		unique_code: code,
		json: voxels,
		image: img,
	};

	const url =
		ENVIRONMENT !== 'local'
			? `${API_BASE_URL}/modeling/update`
			: '/server/api/modeling/update';

	await fetchJSON(url, {
		method: ENVIRONMENT !== 'local' ? 'POST' : 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});

	Swal.fire({
		title: 'Success',
		text: 'Model saved successfully',
		icon: 'success',
		confirmButtonText: 'Ok',
	});
};

// Reset voxels
const resetVoxels = () => {
	Swal.fire({
		title: 'Are you sure you want to reset?',
		text: 'You will lose all your work!',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonText: 'Yes',
		cancelButtonText: 'No',
	}).then((result) => {
		if (result.isConfirmed) {
			localStorage.removeItem('voxels');
			location.reload();
		}
	});
};

// Save voxels as JSON file
const saveAsJson = () => {
	const voxels = JSON.parse(localStorage.getItem('voxels'));
	let code = localStorage.getItem('code');
	const blob = new Blob([JSON.stringify(voxels)], {
		type: 'application/json',
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	// if !code
	if (!code) {
		code = 'voxel-model';
	}

	link.href = url;
	link.download = `${code}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

// Open voxels from JSON file
const openAsJson = () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.click();

	input.onchange = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = (readerEvent) => {
			localStorage.setItem('voxels', readerEvent.target.result);
			location.reload();
		};
		reader.readAsText(file);
	};
};

// Initialize functionality
const initialize = () => {
	handleUrlParams();

	const action = localStorage.getItem('c');
	toggleElementVisibility('#save-market', action === 'c');

	// hide all class .buttonaction if theres v action
	// if (action === 'v') {
	// 	document.querySelectorAll('.button-action').forEach((el) => {
	// 		el.style.display = 'none';
	// 	});
	// 	// hide control hint
	// 	// control-hint
	// 	document.querySelector('.control-hint').style.display = 'none';
	// 	// dg ac
	// 	document.querySelector('.dg.ac').style.display = 'none';
	// 	// navbar
	// 	document.querySelector('.navbar').style.display = 'none';
	// }
};

const toggleControlHint = () => {
	document.querySelector('.control-hint').style.display = 'none';
};

initialize();

// Expose functions to the global scope
window.toggleControlHint = toggleControlHint;
window.reset = resetVoxels;
window.save = saveModel;
window.saveAsJson = saveAsJson;
window.openAsJson = openAsJson;
