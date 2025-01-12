// addLights() {
// 	// Hemisphere white light for modelling
// 	this.ambientLight = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
// 	this.scene.add(this.ambientLight);
// 	// add helper

// 	// spot white light
// 	this.spotLight = new THREE.SpotLight(0xffffff, 1);
// 	this.spotLight.castShadow = true;
// 	this.spotLight.shadow.bias = -0.0001;
// 	this.spotLight.shadow.mapSize.width = 1024 * 4;
// 	this.spotLight.shadow.mapSize.height = 1024 * 4;
// 	this.scene.add(this.spotLight);
// }

export default class LightGuiControl {
	constructor(voxelEditor, gui) {
		this.voxelEditor = voxelEditor;

		this.lightFolder = gui.addFolder('Light');
		// this.lightFolder.open();

		// Ambient Light
		this.ambientLightFolder = this.lightFolder.addFolder('Ambient Light');
		this.ambientLightFolder.open();
		this.ambientLightFolder
			.add(this.voxelEditor.ambientLight, 'intensity', 0, 1, 0.01)
			.name('Intensity');

		// // ambient light color
		// this.ambientLightFolder
		// 	.addColor(this.voxelEditor.ambientLight, 'color')
		// 	.name('Color')
		// 	.onChange(() => {
		// 		this.update();
		// 	});

		this.ambientLightFolder
			.add(this.voxelEditor.ambientLight, 'visible')
			.name('Visible');
	}

	update() {
		this.voxelEditor.updateLight();
	}
}
