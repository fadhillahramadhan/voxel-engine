import { TextureLoader } from 'three';

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
			texture: null, // Holds the texture object
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
				this.voxelEditor.updateMaterial(this.params);
			});

		// Add other material properties
		materialFolder
			.addColor(this.params, 'color')
			.name('Color')
			.onChange((value) => {
				this.params.color = value;
				this.voxelEditor.updateMaterial(this.params);
			});
		materialFolder
			.add(this.params, 'roughness', 0, 1)
			.name('Roughness')
			.onChange((value) => {
				this.params.roughness = value;
				this.voxelEditor.updateMaterial(this.params);
			});
		materialFolder
			.add(this.params, 'metalness', 0, 1)
			.name('Metalness')
			.onChange((value) => {
				this.params.metalness = value;
				this.voxelEditor.updateMaterial(this.params);
			});
		materialFolder
			.add(this.params, 'opacity', 0, 1)
			.name('Opacity')
			.onChange((value) => {
				this.params.opacity = value;
				this.voxelEditor.updateMaterial(this.params);
			});
		materialFolder
			.add(this.params, 'transparent')
			.name('Transparent')
			.onChange((value) => {
				this.params.transparent = value;
				this.voxelEditor.updateMaterial(this.params);
			});

		// Add a custom file input for texture selection
		const textureInput = document.createElement('input');
		textureInput.type = 'file';
		textureInput.accept = 'image/*';
		textureInput.style.display = 'none';

		textureInput.addEventListener('change', (event) => {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const imagePath = e.target.result;
					this.applyTexture(imagePath);
				};
				reader.readAsDataURL(file);
			}
		});

		// Add texture picker button in GUI
		materialFolder
			.add({ selectTexture: () => textureInput.click() }, 'selectTexture')
			.name('Select Texture');

		// Add texture removal button in GUI
		materialFolder
			.add({ removeTexture: () => this.removeTexture() }, 'removeTexture')
			.name('Remove Texture');

		// Open the folder by default (optional)
		materialFolder.open();
	}

	applyTexture(imagePath) {
		if (imagePath) {
			const texture = new TextureLoader().load(imagePath);
			this.params.texture = texture;
			this.voxelEditor.applyTexture(texture);
		}
	}

	removeTexture() {
		this.params.texture = null;
		this.voxelEditor.applyTexture(null);
	}

	setMaterial(newMaterial) {
		this.params.material = newMaterial;
		this.gui.updateDisplay();
	}

	setColor(newColor) {
		this.params.color = newColor;
		this.gui.updateDisplay();
	}

	setTexture(imagePath) {
		this.applyTexture(imagePath);
		this.gui.updateDisplay();
	}
}
