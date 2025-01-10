export default class ModeGuiControl {
	constructor(voxelEditor, gui) {
		this.voxelEditor = voxelEditor;

		this.params = {
			mode: 'default', //default. face, box
			grid: false,
		};

		const modeFolder = gui.addFolder('Mode');

		// close all folders

		modeFolder
			.add(this.params, 'mode', ['default', 'box'])
			.name('Mode')
			.onChange((value) => {
				this.update();
			});

		// remove grid
		modeFolder
			.add(this.params, 'grid')
			.name('Grid')
			.onChange(() => {
				this.update();
			});
	}

	update() {
		console.log(this.params);
		this.voxelEditor.updateMode();
	}
}
