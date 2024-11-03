// Voxel.js
import * as THREE from 'three';
import * as dat from 'dat.gui';

export default class Voxel {
	constructor(position, properties) {
		this.geometry = new THREE.BoxGeometry(1, 1, 1);

		if (
			properties.material === 'Standard' ||
			properties.material === 'MeshStandardMaterial'
		) {
			this.material = new THREE.MeshStandardMaterial(properties);
		} else if (
			properties.material === 'Lambert' ||
			properties.material === 'MeshLambertMaterial'
		) {
			this.material = new THREE.MeshLambertMaterial(properties);
		} else if (
			properties.material === 'Phong' ||
			properties.material === 'MeshPhongMaterial'
		) {
			this.material = new THREE.MeshPhongMaterial(properties);
		}

		if (!this.material) {
			console.error('Invalid material type');
			return;
		}

		this.#createMesh(position);
	}

	#createMesh(position) {
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.copy(position);
	}
}
