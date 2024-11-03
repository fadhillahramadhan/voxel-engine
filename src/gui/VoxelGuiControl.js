export default class VoxelGuiControl {
	constructor(voxelEditor, dat) {
		this.voxelEditor = voxelEditor;

		this.params = {
			color: '#00ff00', // Default voxel color (green)
			roughness: 0.5,
			metalness: 0.5,
			opacity: 1,
			transparent: false,
			material: 'Standard',
		};

		// Initialize the dat.GUI instance
		this.gui = dat;

		// Create a folder for material properties
		const materialTypes = ['Standard', 'Lambert', 'Phong'];

		const materialFolder = this.gui.addFolder('Material');

		// Add material type selection
		materialFolder
			.add(this.params, 'material', materialTypes)
			.name('Material Type')
			.onChange((value) => {
				this.params.material = value;
			});

		// Add other material properties
		materialFolder.addColor(this.params, 'color').name('Color');
		materialFolder.add(this.params, 'roughness', 0, 1).name('Roughness');
		materialFolder.add(this.params, 'metalness', 0, 1).name('Metalness');
		materialFolder.add(this.params, 'opacity', 0, 1).name('Opacity');
		materialFolder.add(this.params, 'transparent').name('Transparent');

		// Open the folder by default (optional)
		materialFolder.open();
	}

	setMaterial(newMaterial) {
		this.params.material = newMaterial;
		this.gui.updateDisplay();
	}

	setColor(newColor) {
		this.params.color = newColor;
		this.gui.updateDisplay();
	}
}
