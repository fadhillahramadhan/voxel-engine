export default class LightGuiControl {
	constructor(voxelEditor, gui) {
		this.voxelEditor = voxelEditor;

		this.params = {
			ambientIntensity: 10,
			directionalIntensity: 1,
			ambientColor: '#404040',
			directionalColor: '#ffffff',
		};

		// Create a folder for lighting properties in the shared GUI instance
		const lightFolder = gui.addFolder('Lighting'); // This is a proper folder

		lightFolder
			.add(this.params, 'ambientIntensity', 0, 100)
			.name('Ambient Intensity')
			.onChange(() => {
				this.update();
			});

		lightFolder
			.addColor(this.params, 'ambientColor')
			.name('Ambient Color')
			.onChange(() => {
				this.update();
			});
		lightFolder
			.add(this.params, 'directionalIntensity', 0, 100)
			.name('Directional Intensity')
			.onChange(() => {
				this.update();
			});
		lightFolder
			.addColor(this.params, 'directionalColor')
			.name('Directional Color')
			.onChange(() => {
				this.update();
			});

		// directional position
		lightFolder.add(
			this.voxelEditor.directionalLight.position,
			'x',
			-100,
			100
		);
		lightFolder.add(
			this.voxelEditor.directionalLight.position,
			'y',
			-100,
			100
		);
		lightFolder.add(
			this.voxelEditor.directionalLight.position,
			'z',
			-100,
			100
		);

		// Allow the Lighting folder to be collapsible/minimizable
		// lightFolder.open(); // Opens by default, but can be minimized
	}

	update() {
		this.voxelEditor.updateLight();
	}
}
