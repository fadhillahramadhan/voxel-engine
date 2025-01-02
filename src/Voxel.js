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
			return;
		}
		// ture loaded: _Texture {isTexture: true, uuid: '059cc6e9-252f-40e7-9ff0-d6010dc06ae1', name: '', source: Source, mipmaps: Array(0), …} is already like that
		// if there is a texture, apply it to the material
		if (properties.texture) {
			this.material.map = properties.texture;
			// remove color property if texture is applied
			delete this.material.color;
		}

		this.#createMesh(position);
	}

	#createMesh(position) {
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.copy(position);
	}
}
