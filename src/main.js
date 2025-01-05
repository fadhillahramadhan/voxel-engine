// main.js
import VoxelEditor from './VoxelEditor.js';

document.addEventListener('DOMContentLoaded', () => {
	const editor = new VoxelEditor();
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ENVIROMENT = import.meta.env.ENVIRONMENT;

// Function to toggle the visibility of control hint
function toggleControlHint() {
	const controlHint = document.querySelector('.control-hint');
	controlHint.classList.toggle('hidden');
}

const urlParams = new URLSearchParams(window.location.search);
// remove it and save it to local storage
if (urlParams.has('code')) {
	const code = urlParams.get('code');

	window.history.replaceState({}, document.title, '/');

	localStorage.setItem('code', code);

	getVoxels(code);
}

function getVoxels(code) {
	if (ENVIROMENT !== 'local') {
		fetch(`${API_BASE_URL}/modeling/get?unique_code=${code}`, {
			method: 'GET',
		})
			.then((response) => {
				return response.json();
			})
			.then((data) => {
				localStorage.setItem('voxels', JSON.stringify(data.data));
				window.location.reload();
			});
	} else {
		fetch('/server/custom_models/' + code + '.json', {
			method: 'GET',
		})
			.then((response) => {
				return response.json();
			})
			.then((data) => {
				localStorage.setItem('voxels', JSON.stringify(data));
				location.reload();
			});
	}
}

function reset() {
	// localStorage.removeItem('voxels');
	// location.reload();
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
}

window.reset = reset;

function save() {
	const voxels = JSON.parse(localStorage.getItem('voxels'));
	const code = localStorage.getItem('code');

	// Take a screenshot of the canvas
	const canvas = document.querySelector('canvas');
	const img = canvas.toDataURL('image/png'); // Base64-encoded PNG image

	const payload = {
		unique_code: code,
		json: voxels,
		image: img, // Include the image in the payload
	};

	if (ENVIROMENT !== 'local') {
		fetch(`${API_BASE_URL}/modeling/update`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		})
			.then((response) => {
				return response.json();
			})
			.then((data) => {
				Swal.fire({
					title: 'Success',
					text: 'Model saved successfully',
					icon: 'success',
					confirmButtonText: 'Ok',
				});
			});
	} else {
		fetch('/server/api/modeling/update', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		})
			.then((response) => {
				return response.json();
			})
			.then((data) => {
				Swal.fire({
					title: 'Success',
					text: 'Model saved successfully',
					icon: 'success',
					confirmButtonText: 'Ok',
				});
			});
	}
}

// save as json
function saveAsJson() {
	const voxels = JSON.parse(localStorage.getItem('voxels'));
	const code = localStorage.getItem('code');

	const blob = new Blob([JSON.stringify(voxels)], {
		type: 'application/json',
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${code}.json`;
	document.body.appendChild(a);
	a.click();
	setTimeout(() => {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 0);
}

window.saveAsJson = saveAsJson;

// open as json
function openAsJson() {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.click();

	input.onchange = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.readAsText(file, 'UTF-8');
		reader.onload = (readerEvent) => {
			const content = readerEvent.target.result;
			localStorage.setItem('voxels', content);
			location.reload();
		};
	};
}

window.openAsJson = openAsJson;

window.save = save;
