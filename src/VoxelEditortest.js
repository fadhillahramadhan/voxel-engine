import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// glb loader
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// rgbe loader
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import Voxel from './Voxel.js';
import VoxelGuiControl from './gui/VoxelGuiControl.js';
import LightGuiControl from './gui/LightGuiControl.js';
import ModeGuiControl from './gui/ModeGuiControl.js';

// add gsap
import gsap from 'gsap';

import * as dat from 'dat.gui';

let gui = new dat.GUI();

// Import via ES6 modules
import {
	computeBoundsTree,
	disposeBoundsTree,
	acceleratedRaycast,
} from 'three-mesh-bvh';

// Generate geometry and associated BVH
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export default class VoxelEditor {
	constructor() {
		this.initScene();
		this.addLights();
		this.addGrid();
		this.addGroundPlane();
		this.addGhostVoxel();
		this.addEventListeners();

		this.mode = 'default'; //['default', 'box'];
		this.ModeGuiControl = new ModeGuiControl(this, gui);

		this.voxels = [];
		this.undoStack = [];
		this.redoStack = [];
		this.voxelColor = new THREE.Color(0x00ff00);

		this.VoxelGuiControl = new VoxelGuiControl(this, gui);

		// Initialize the LightGuiControl and pass references to the lights
		this.LightGuiControl = new LightGuiControl(this, gui);
		this.rayCaster = new THREE.Raycaster();

		this.nearestColor = 0x00ff00;
		this.model = null;

		this.sceneColor = '#000000';

		this.startPoint = null;
		this.endPoint = null;
		this.lastStartPoint = null;

		this.loadVoxels();
		this.animate();
	}

	initScene() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);

		// Select the canvas element by ID and pass it to WebGLRenderer
		const canvas = document.getElementById('canvas');
		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			preserveDrawingBuffer: true,
		});
		// this.renderer.setClearColor(0x87ceeb, 1);
		// showing model color
		// this.renderer.setClearColor(0x000000, 1);
		// white clear
		this.renderer.setClearColor(0xffffff, 1);

		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.controls = new OrbitControls(
			this.camera,
			this.renderer.domElement
		);
		this.camera.position.set(10, 10, 20);
		this.controls.update();

		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		this.voxelSize = 1;
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

	addGrid() {
		this.gridHelper = new THREE.GridHelper(50, 50);
		this.gridHelper.position.y -= 0.5;
		this.gridHelper.position.x -= 0.5;
		this.gridHelper.position.z -= 0.5;
		this.scene.add(this.gridHelper);
	}

	addGroundPlane() {
		const planeGeometry = new THREE.PlaneGeometry(50, 50);
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
		this.scene.add(this.ghostVoxel);
		this.ghostVoxel.visible = false;
	}

	addEventListeners() {
		window.addEventListener(
			'mousedown',
			this.onDocumentMouseDown.bind(this),
			false
		);
		window.addEventListener(
			'mousemove',
			this.onDocumentMouseMove.bind(this),
			false
		);
		window.addEventListener(
			'contextmenu',
			this.onDocumentRightClick.bind(this),
			false
		);
		window.addEventListener(
			'resize',
			this.onWindowResize.bind(this),
			false
		);

		window.addEventListener('keydown', (event) => {
			if (event.key === 'e') {
				this.exportToOBJ();
			}
			if (event.key === 'p') {
				this.pickColorFromVoxel();
			}
			if (event.ctrlKey && event.key === 'z') {
				this.undo();
			}
			if (event.ctrlKey && event.key === 'y') {
				this.redo();
			}
			// if event s switch between modes
			if (event.key === 's') {
				this.ModeGuiControl.params.mode = 'default';
				this.updateMode();
			}
			// import obj or gltf
			if (event.key === 'i') {
				this.importOBJGLTFtoVoxel();
			}
		});
	}

	// ON MOUSE MOVE HANDLE BOX MODE
	onDocumentMouseMove(event) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		this.raycaster.setFromCamera(this.mouse, this.camera);

		const intersects = this.raycaster.intersectObjects(this.voxels);

		if (intersects.length > 0) {
			const intersect = intersects[0];
			const faceNormal = intersect.face.normal.clone();
			const newPosition = intersect.object.position
				.clone()
				.add(faceNormal);
			this.snapToGrid(newPosition);

			this.ghostVoxel.position.copy(newPosition);
			this.ghostVoxel.visible = true;
		} else {
			const planeIntersect = this.raycaster.intersectObject(
				this.groundPlane
			);
			if (planeIntersect.length > 0) {
				const point = planeIntersect[0].point;
				this.snapToGrid(point);

				this.ghostVoxel.position.copy(point);
				this.ghostVoxel.visible = true;
			} else {
				this.ghostVoxel.visible = false;
			}
		}
	}

	onDocumentMouseDown(event) {
		if (
			event.button === 0 &&
			this.mode === 'default' &&
			this.ghostVoxel.visible
		) {
			const startTime = performance.now(); // Mulai pengukuran waktu

			// Default mode: add single voxel
			const newVoxel = new Voxel(
				this.ghostVoxel.position.clone(),
				this.VoxelGuiControl.params
			);

			// GSAP Animation
			gsap.from(newVoxel.mesh.scale, {
				duration: 1,
				x: 0,
				y: 0,
				z: 0,
				ease: 'bounce',
			});

			// check first if there is a voxel in the same position
			const existingVoxel = this.voxels.find((voxel) =>
				voxel.position.equals(newVoxel.mesh.position)
			);

			if (existingVoxel) {
				return;
			}

			// Add to scene
			this.scene.add(newVoxel.mesh);
			this.voxels.push(newVoxel.mesh);
			this.saveVoxels();

			// Push to undo stack
			this.undoStack.push({
				type: 'add',
				voxel: newVoxel.mesh,
			});
			this.redoStack = []; // Clear redo stack on new action

			const endTime = performance.now(); // Selesai pengukuran waktu
			console.log(
				'Waktu eksekusi Normal Mode: ' + (endTime - startTime) + ' ms'
			);
		} else if (event.button === 0 && this.mode === 'box') {
			// place ghostvoxel with opacity

			if (!this.startPoint) {
				this.startPoint = this.ghostVoxel.position.clone();
			} else {
				// remove last startpoint
				this.scene.remove(this.lastStartPoint);

				this.endPoint = this.ghostVoxel.position.clone();
				this.createVoxelBox(this.startPoint, this.endPoint);
				this.startPoint = null;
				this.endPoint = null;
			}

			// if theres start point place one block just like normal mode
			if (this.startPoint) {
				// but like a ghost voxel
				let lastStartPointMaterial = new THREE.MeshStandardMaterial({
					color: 0x0000ff,
					opacity: 0.5,
					transparent: true,
				});

				const ghostGeometry = new THREE.BoxGeometry(
					this.voxelSize,
					this.voxelSize,
					this.voxelSize
				);

				this.lastStartPoint = new THREE.Mesh(
					ghostGeometry,
					lastStartPointMaterial
				);
				this.lastStartPoint.position.copy(this.startPoint);

				this.scene.add(this.lastStartPoint);
			}
		}
	}

	onDocumentRightClick(event) {
		event.preventDefault();
		const intersects = this.raycaster.intersectObjects(this.voxels);
		if (intersects.length > 0) {
			const intersectedVoxel = intersects[0].object;

			// gsap animation
			gsap.to(intersectedVoxel.scale, {
				duration: 1,
				x: 0,
				y: 0,
				z: 0,
				onComplete: () => {
					this.scene.remove(intersectedVoxel);
				},
			});

			this.voxels = this.voxels.filter(
				(voxel) => voxel !== intersectedVoxel
			);
			this.saveVoxels();

			// Push to undo stack
			this.undoStack.push({
				type: 'remove',
				voxel: intersectedVoxel,
			});
			this.redoStack = [];
		}
	}

	createVoxelBox(start, end) {
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
					const newVoxel = new Voxel(
						position,
						this.VoxelGuiControl.params
					);
					// add gsap
					gsap.from(newVoxel.mesh.scale, {
						duration: 1,
						x: 0,
						y: 0,
						z: 0,
					});

					this.scene.add(newVoxel.mesh);
					this.voxels.push(newVoxel.mesh);
					addedVoxels.push(newVoxel.mesh);
				}
			}
		}
		this.saveVoxels();

		// Add to undo stack
		this.undoStack.push({
			type: 'addBox',
			voxels: addedVoxels,
		});
		this.redoStack = [];
	}

	undo() {
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

	redo() {
		if (this.redoStack.length === 0) return;
		const action = this.redoStack.pop();
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

	pickColorFromVoxel() {
		const intersects = this.raycaster.intersectObjects(this.voxels);

		if (intersects.length > 0) {
			const intersectedVoxel = intersects[0].object;
			this.nearestColor = intersectedVoxel.material.color.getHex();

			const hexColor = `#${this.nearestColor
				.toString(16)
				.padStart(6, '0')}`;
			this.VoxelGuiControl.setColor(hexColor);
			this.voxelColor = new THREE.Color(this.nearestColor);
		}
	}

	snapToGrid(position) {
		position.x = Math.round(position.x / this.voxelSize) * this.voxelSize;
		position.y = Math.round(position.y / this.voxelSize) * this.voxelSize;
		position.z = Math.round(position.z / this.voxelSize) * this.voxelSize;
	}

	onWindowResize() {
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	}

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

	loadVoxels() {
		const voxelData = JSON.parse(localStorage.getItem('voxels')) || [];
		voxelData.forEach((data) => {
			// change texture to texture map
			if (data.texture) {
				const loader = new THREE.TextureLoader();
				data.texture = loader.load(data.textureSrc);
			} else {
				data.texture = null;
			}

			const position = new THREE.Vector3(...data.position);
			const voxel = new Voxel(position, {
				color: data.color,
				roughness: data.roughness,
				metalness: data.metalness,
				opacity: data.opacity,
				transparent: data.opacity < 1,
				material: data.material,
				texture: data.texture,
			});

			// like randomly going into the scene
			gsap.from(voxel.mesh.position, {
				duration: 1,
				x: Math.random() * 10 - 5,
				y: Math.random() * 10 - 5,
				z: Math.random() * 10 - 5,
			});

			this.scene.add(voxel.mesh);
			this.voxels.push(voxel.mesh);
		});
	}

	updateLight() {
		this.ambientLight.color.set(this.LightGuiControl.params.ambientColor);
		this.ambientLight.intensity =
			this.LightGuiControl.params.ambientIntensity;

		this.directionalLight.color.set(
			this.LightGuiControl.params.directionalColor
		);
		this.directionalLight.intensity =
			this.LightGuiControl.params.directionalIntensity;
	}

	updateMode() {
		this.mode = this.ModeGuiControl.params.mode;
		// remove gridhelper
		if (!this.ModeGuiControl.params.grid) {
			// rmove a gridHelper
			this.scene.remove(this.gridHelper);
		} else {
			// add a gridHelper
			this.scene.add(this.gridHelper);
		}

		// also check for scene color it would be hex
		this.sceneColor = this.ModeGuiControl.params.sceneColor;
		this.renderer.setClearColor(this.sceneColor, 1);

		console.log(this.mode.params);
	}

	animate() {
		requestAnimationFrame(this.animate.bind(this));
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	}

	exportToOBJ() {
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
	}

	importOBJGLTFtoVoxel() {
		// asking for modelaccuracy and startpoint

		let modelAccuracy = prompt('Enter model accuracy');

		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.obj,.gltf,.glb';
		input.onchange = async (event) => {
			const file = event.target.files[0];
			const extension = file.name.split('.').pop().toLowerCase();

			// save to public folder
			const url = URL.createObjectURL(file);
			const loader = new GLTFLoader();
			const dracoLoader = new DRACOLoader();
			dracoLoader.setDecoderPath('three/examples/js/libs/draco/');
			loader.setDRACOLoader(dracoLoader);

			loader.load(url, (gltf) => {
				this.voxelizeModel(gltf.scene, modelAccuracy);
			});
		};
		input.click();
	}

	voxelizeModel(importedScene, modelAccuracy) {
		let startPoint = 10;
		let params = {
			modelSize: modelAccuracy,
			gridSize: 0.2,
		};

		const importedMeshes = [];
		importedScene.traverse((child) => {
			if (child.isMesh && child.geometry) {
				console.log(child);
				child.geometry.computeBoundsTree();
				// child.geometry.disposeBoundsTree();
				child.material.side = THREE.DoubleSide;
				importedMeshes.push(child);
			}
		});

		let boundingBox = new THREE.Box3().setFromObject(importedScene);
		const size = boundingBox.getSize(new THREE.Vector3());
		const scaleFactor = params.modelSize / size.length();
		const center = boundingBox
			.getCenter(new THREE.Vector3())
			.multiplyScalar(-scaleFactor);

		importedScene.scale.multiplyScalar(scaleFactor);
		importedScene.position.copy(center);

		boundingBox = new THREE.Box3().setFromObject(importedScene);
		// boundingBox.min.y += 0.5 * params.gridSize; // Adjust grid for better visualization

		const voxelHash = new Set(); // Use Set for faster checking
		const modelVoxels = [];

		// Precompute step values and bounding box floors
		const minX = Math.floor(boundingBox.min.x);
		const minY = Math.floor(boundingBox.min.y);
		const minZ = Math.floor(boundingBox.min.z);
		const maxX = Math.floor(boundingBox.max.x);
		const maxY = Math.floor(boundingBox.max.y);
		const maxZ = Math.floor(boundingBox.max.z);

		const gridStep = params.gridSize;

		// Main loop
		for (let i = minX; i < maxX; i += gridStep) {
			for (let j = minY; j < maxY; j += gridStep) {
				for (let k = minZ; k < maxZ; k += gridStep) {
					const pos = new THREE.Vector3(i, j, k);
					const hashKey = `${Math.floor(pos.x)},${Math.floor(
						pos.y
					)},${Math.floor(pos.z)}`;

					if (!voxelHash.has(hashKey)) {
						// Check if voxel is inside mesh
						let foundVoxel = false;
						for (
							let meshCnt = 0;
							meshCnt < importedMeshes.length;
							meshCnt++
						) {
							const mesh = importedMeshes[meshCnt];

							// get h s l from color
							const color = new THREE.Color();

							const { h, s, l } =
								mesh.material.color.getHSL(color);
							color.setHSL(h, s * 0.8, l * 0.8 + 0.2);

							// color to hex

							// set color to voxel
							this.VoxelGuiControl.setColor(color.getHex());

							if (
								this.isInsideMesh(
									pos,
									new THREE.Vector3(0, 0, 1),
									mesh
								)
							) {
								pos.x = Math.floor(pos.x);
								pos.y = Math.floor(pos.y + startPoint);
								pos.z = Math.floor(pos.z);

								const voxel = new Voxel(
									pos,
									this.VoxelGuiControl.params
								);
								voxelHash.add(hashKey); // Mark as occupied
								modelVoxels.push(voxel);

								// Add voxel mesh to the scene
								this.scene.add(voxel.mesh);
								this.voxels.push(voxel.mesh);
								this.saveVoxels();
								foundVoxel = true;
								break; // Exit mesh loop once voxel is found
							}
						}

						// Only add voxel to hash if found
						if (foundVoxel) {
							voxelHash.add(hashKey);
						}
					}
				}
			}
		}
	}

	isInsideMesh(pos, ray, mesh) {
		this.rayCaster.set(pos, ray);
		this.rayCasterIntersects = this.rayCaster.intersectObject(mesh, false);
		return this.rayCasterIntersects.length % 2 === 1;
	}

	// export image
	exportImage() {
		var strMime = 'image/jpeg';
		let imgData = this.renderer.domElement.toDataURL(strMime);

		var link = document.createElement('a');
		link.download = 'image.jpg';
		link.href = imgData;
		link.click();
	}
}