export default class ModeGuiControl {
	constructor(voxelEditor, gui) {
		this.voxelEditor = voxelEditor;

		this.params = {
			mode: 'default', //default. face, box
		};

		const modeFolder = gui.addFolder('Mode');

		modeFolder
			.add(this.params, 'mode', ['default', 'box'])
			.name('Mode')
			.onChange(() => {
				this.update();
			});

		modeFolder.open();
	}

	update() {
		this.voxelEditor.updateMode();
	}
}
