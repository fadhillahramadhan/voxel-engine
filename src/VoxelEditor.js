import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

// glb loader
import Voxel from './Voxel.js';
import VoxelGuiControl from './gui/VoxelGuiControl.js';
import LightGuiControl from './gui/LightGuiControl.js';
import ModeGuiControl from './gui/ModeGuiControl.js';

// add gsap
import gsap from 'gsap';

import * as dat from 'dat.gui';

export default class VoxelEditor {
	constructor() {
		const canvas = document.getElementById('canvas');

		this.scene = new THREE.Scene();

		// Select the canvas element by ID and pass it to WebGLRenderer
		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			preserveDrawingBuffer: true,
		});
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 2.3;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor('#fafaf4', 1);

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.camera.position.set(10, 10, 20);

		this.controls = new OrbitControls(
			this.camera,
			this.renderer.domElement
		);
		this.controls.update();

		// Raycaster
		this.raycaster = new THREE.Raycaster();

		// Mouse
		this.mouse = new THREE.Vector2();

		// Config
		this.voxelSize = 1;
		this.voxels = [];

		// Stack for undo and redo
		this.undoStack = [];
		this.redoStack = [];

		// Start and end point for box mode
		this.startPoint = null;
		this.endPoint = null;

		this.gridSize = 30;

		// GUI Controls
		let gui = new dat.GUI();
		this.ModeGuiControl = new ModeGuiControl(this, gui);
		this.VoxelGuiControl = new VoxelGuiControl(this, gui);

		this.addGrid();
		this.addGroundHelper();
		this.addEventListeners();
		this.addLights();
		this.addGhostVoxel();

		this.load = false;
		this.loadVoxels();
		this.animate();
	}

	// Adding methods
	addGrid() {
		this.gridHelper = new THREE.GridHelper(this.gridSize, this.gridSize);
		this.gridHelper.position.y -= 0.5;
		this.gridHelper.position.x -= 0.5;
		this.gridHelper.position.z -= 0.5;
		this.scene.add(this.gridHelper);
	}

	addGroundHelper() {
		const planeGeometry = new THREE.PlaneGeometry(
			this.gridSize,
			this.gridSize
		);
		const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });

		this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
		this.groundPlane.rotation.x = -Math.PI / 2;

		this.scene.add(this.groundPlane);
	}

	addGhostVoxel() {
		const ghostMaterial = new THREE.MeshStandardMaterial({
			color: 0x0000ff,
			opacity: 0.5,
			transparent: true,
		});

		const ghostGeometry = new THREE.BoxGeometry(
			this.voxelSize,
			this.voxelSize,
			this.voxelSize
		);

		this.ghostVoxel = new THREE.Mesh(ghostGeometry, ghostMaterial);
		this.ghostVoxel.visible = false;

		this.scene.add(this.ghostVoxel);
	}

	addLights() {
		this.ambientLight = new THREE.AmbientLight(0x404040);
		this.ambientLight.intensity = 10;
		this.scene.add(this.ambientLight);

		// Directional light
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		this.directionalLight.position.set(5, 10, 7.5).normalize();
		// add sphere to visualize the light
		const sphereSize = 1;
		const directionalLightHelper = new THREE.PointLightHelper(
			this.directionalLight,
			sphereSize
		);
		this.scene.add(directionalLightHelper);
		this.scene.add(this.directionalLight);
	}

	addVoxel(position, settings) {
		const existingVoxel = this.voxels.find((voxel) =>
			voxel.position.equals(position)
		);

		if (existingVoxel) {
			this.scene.remove(existingVoxel.mesh);
			this.voxels = this.voxels.filter(
				(voxel) => voxel !== existingVoxel
			);
		}

		const newVoxel = new Voxel(
			position,
			settings || this.VoxelGuiControl.params
		);

		gsap.from(newVoxel.mesh.scale, {
			duration: 1,
			x: 0,
			y: 0,
			z: 0,
			ease: 'back.out(1.7)',
		});

		this.scene.add(newVoxel.mesh);
		this.voxels.push(newVoxel.mesh);

		if (this.ModeGuiControl.params.mode != 'box') {
			this.undoStack.push({
				type: 'add',
				voxel: newVoxel.mesh,
			});
			this.redoStack = [];
		}

		if (!this.load) {
			this.saveVoxels();
		}

		return newVoxel;
	}

	addVoxelBox(start, end) {
		this.load = true;
		const addedVoxels = [];

		// Calculate the min and max points
		const minX = Math.min(start.x, end.x);
		const maxX = Math.max(start.x, end.x);
		const minY = Math.min(start.y, end.y);
		const maxY = Math.max(start.y, end.y);
		const minZ = Math.min(start.z, end.z);
		const maxZ = Math.max(start.z, end.z);

		// add start end ghostvoxel

		// Loop over the dimensions to create a box of voxels
		for (let x = minX; x <= maxX; x += this.voxelSize) {
			for (let y = minY; y <= maxY; y += this.voxelSize) {
				for (let z = minZ; z <= maxZ; z += this.voxelSize) {
					const position = new THREE.Vector3(x, y, z);

					// check if the voxel already exists
					const existingVoxel = this.voxels.find((voxel) =>
						voxel.position.equals(position)
					);

					if (existingVoxel) {
						continue;
					}

					let voxel = this.addVoxel(
						position,
						this.VoxelGuiControl.params
					);

					addedVoxels.push(voxel.mesh);
				}
			}
		}
		this.saveVoxels();
		this.load = false;
		console.log(addedVoxels);
		this.undoStack.push({
			type: 'addBox',
			voxels: addedVoxels,
		});
		this.redoStack = [];
	}

	removeVoxel(voxel) {
		gsap.to(voxel.scale, {
			duration: 1,
			x: 0,
			y: 0,
			z: 0,
			onComplete: () => {
				this.scene.remove(voxel);
			},
		});
		this.voxels = this.voxels.filter((v) => v !== voxel);

		this.undoStack.push({
			type: 'remove',
			voxel: voxel,
		});

		this.redoStack = [];

		if (!this.load) {
			this.saveVoxels();
		}
	}

	// O (n) time complexity
	saveVoxels() {
		const voxelData = this.voxels.map((voxel) => {
			let color = voxel.material.color
				? voxel.material.color.getHex()
				: 0x00ff00;

			let data = {
				position: voxel.position.toArray(),
				color: color,
				roughness: voxel.material.roughness,
				metalness: voxel.material.metalness,
				opacity: voxel.material.opacity,
				material: voxel.material.type,
				texture: voxel.material.map,
				textureSrc: voxel.material.map
					? voxel.material.map.image.src
					: null,
			};
			return data;
		});

		localStorage.setItem('voxels', JSON.stringify(voxelData));
	}

	// O (n) time complexity
	loadVoxels() {
		const voxelData = JSON.parse(localStorage.getItem('voxels')) || [];

		this.load = true;

		voxelData.forEach((data) => {
			// change texture to texture map
			if (data.texture) {
				const loader = new THREE.TextureLoader();
				data.texture = loader.load(data.textureSrc);
			} else {
				data.texture = null;
			}

			const position = new THREE.Vector3(...data.position);

			this.addVoxel(position, data);
		});

		this.load = false;
	}

	undoVoxel() {
		if (this.undoStack.length === 0) return;
		const action = this.undoStack.pop();
		this.redoStack.push(action);

		if (action.type === 'add') {
			this.scene.remove(action.voxel);
			this.voxels = this.voxels.filter((v) => v !== action.voxel);
			this.saveVoxels();
		} else if (action.type === 'remove') {
			this.scene.add(action.voxel);
			this.voxels.push(action.voxel);
			this.saveVoxels();
		} else if (action.type === 'addBox') {
			action.voxels.forEach((voxel) => {
				this.scene.remove(voxel);
				this.voxels = this.voxels.filter((v) => v !== voxel);
			});
			this.saveVoxels();
		}
	}

	redoVoxel() {
		if (this.redoStack.length === 0) return;
		const action = this.redoStack.pop();

		gsap.from(action.voxel.scale, {
			duration: 1,
			x: 0,
			y: 0,
			z: 0,
			ease: 'back.out(1.7)',
		});

		this.undoStack.push(action);

		if (action.type === 'add') {
			this.scene.add(action.voxel);
			this.voxels.push(action.voxel);
			this.saveVoxels();
		} else if (action.type === 'remove') {
			this.scene.remove(action.voxel);
			this.voxels = this.voxels.filter((v) => v !== action.voxel);
			this.saveVoxels();
		} else if (action.type === 'addBox') {
			action.voxels.forEach((voxel) => {
				this.scene.add(voxel);
				this.voxels.push(voxel);
			});
			this.saveVoxels();
		}
	}

	listenModeGuiControl() {
		console.log(this.ModeGuiControl.params);
		if (this.ModeGuiControl.params.grid) {
			this.gridHelper.visible = true;
		} else {
			this.gridHelper.visible = false;
		}

		// Change scene color
		this.renderer.setClearColor(this.ModeGuiControl.params.sceneColor, 1);
	}

	// Event Listeners
	addEventListeners() {
		// dobnt use bind
		window.addEventListener('mousedown', (e) =>
			this.onDocumentMouseDown(e)
		);
		window.addEventListener('mousemove', (e) =>
			this.onDocumentMouseMove(e)
		);
		window.addEventListener(
			'contextmenu',
			this.onDocumentRightClick.bind(this),
			false
		);

		window.addEventListener('keydown', (event) => {
			if (event.ctrlKey && event.key === 'z') {
				this.undoVoxel();
			}
			if (event.ctrlKey && event.key === 'y') {
				this.redoVoxel();
			}
			if (event.key === 'e') {
				this.exportToOBJ();
			}
		});
	}

	onDocumentMouseMove(event) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		this.raycaster.setFromCamera(this.mouse, this.camera);

		const intersects = this.raycaster.intersectObjects(this.voxels);

		if (intersects.length > 0) {
			const intersect = intersects[0];
			const faceNormal = intersect.face.normal.clone();
			const position = intersect.object.position.clone().add(faceNormal);

			position.x =
				Math.floor(position.x / this.voxelSize) * this.voxelSize;
			position.y =
				Math.floor(position.y / this.voxelSize) * this.voxelSize;
			position.z =
				Math.floor(position.z / this.voxelSize) * this.voxelSize;

			// return nothing if y is less than 0
			if (position.y < 0) {
				return;
			}

			this.ghostVoxel.position.copy(position);
			this.ghostVoxel.visible = true;
		} else {
			const planeIntersect = this.raycaster.intersectObject(
				this.groundPlane
			);
			if (planeIntersect.length > 0) {
				let position = planeIntersect[0].point;

				position.x =
					Math.floor(position.x / this.voxelSize) * this.voxelSize;
				position.y =
					Math.floor(position.y / this.voxelSize) * this.voxelSize;
				position.z =
					Math.floor(position.z / this.voxelSize) * this.voxelSize;

				// return nothing if y is less than 0
				if (position.y < 0) {
					return;
				}

				this.ghostVoxel.position.copy(position);
				this.ghostVoxel.visible = true;
			} else {
				this.ghostVoxel.visible = false;
			}
		}
	}

	onDocumentMouseDown(event) {
		if (
			this.ghostVoxel.position.x < -this.gridSize / 2 ||
			this.ghostVoxel.position.x > (this.gridSize - 1) / 2 ||
			this.ghostVoxel.position.z < -this.gridSize / 2 ||
			this.ghostVoxel.position.z > (this.gridSize - 1) / 2 ||
			this.ghostVoxel.position.y < 0
		) {
			return; // Don't allow placement
		}

		if (
			event.button === 0 &&
			this.ghostVoxel.visible &&
			this.ModeGuiControl.params.mode === 'default'
		) {
			this.addVoxel(this.ghostVoxel.position.clone());
		}

		if (event.button === 0 && this.ModeGuiControl.params.mode === 'box') {
			if (!this.startPoint) {
				this.startPoint = this.ghostVoxel.position.clone();
			} else {
				// remove last startpoint
				this.scene.remove(this.lastStartPoint);
				this.endPoint = this.ghostVoxel.position.clone();

				this.addVoxelBox(this.startPoint, this.endPoint);

				this.startPoint = null;
				this.endPoint = null;
			}
		}
	}

	onDocumentRightClick(event) {
		event.preventDefault();
		const intersects = this.raycaster.intersectObjects(this.voxels);
		if (intersects.length > 0) {
			const intersectedVoxel = intersects[0].object;

			this.removeVoxel(intersectedVoxel);
		}
	}

	animate() {
		requestAnimationFrame(this.animate.bind(this));

		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	}

	exportToOBJ() {
		// remove grid and ground plane
		this.scene.remove(this.gridHelper);
		this.scene.remove(this.groundPlane);

		const exporter = new GLTFExporter();
		exporter.parse(
			this.scene,
			(gltf) => {
				const blob = new Blob([JSON.stringify(gltf)], {
					type: 'application/json',
				});
				const link = document.createElement('a');
				link.href = URL.createObjectURL(blob);
				link.download = 'scene.gltf';
				link.click();
			},
			{ binary: false }
		);

		// add grid and ground plane
		this.scene.add(this.gridHelper);
		this.scene.add(this.groundPlane);
	}
}
