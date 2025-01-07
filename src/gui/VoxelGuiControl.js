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
		// materialFolder.open();
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
}
