from graphviz import Digraph

# Initialize a directed graph
flowchart = Digraph('VoxelEditorFlow', format='png')
flowchart.attr(rankdir='TB', size='10')

# Nodes for initialization
flowchart.node('A', 'Initialize Scene & GUI\n(setup scene, camera, controls, GUI)', shape='parallelogram')

# Event Listeners
flowchart.node('B', 'Event Listeners\n(mousedown, mousemove,\ncontextmenu, keydown)', shape='parallelogram')
flowchart.edge('A', 'B')

# Add Voxel (Mousedown)
flowchart.node('C1', 'Mousedown Event\nCheck Mode: "Default"', shape='diamond')
flowchart.edge('B', 'C1', label='Mousedown')

flowchart.node('C2', 'Add Voxel\n(position, color)', shape='box')
flowchart.edge('C1', 'C2', label='If Default')

flowchart.node('C3', 'Save Voxel\n(update scene, push to undoStack)', shape='box')
flowchart.edge('C2', 'C3')

flowchart.node('C4', 'Box Mode\nCheck Start/End Points', shape='diamond')
flowchart.edge('C1', 'C4', label='If Box Mode')

flowchart.node('C5', 'Add Voxel Box\n(between Start & End points)', shape='box')
flowchart.edge('C4', 'C5', label='End Point Selected')

flowchart.edge('C5', 'C3')

# Remove Voxel (Right-Click)
flowchart.node('D1', 'Right-click Event\nDetect Intersection', shape='diamond')
flowchart.edge('B', 'D1', label='Right-click')

flowchart.node('D2', 'Remove Voxel\n(remove from scene,\nupdate undoStack)', shape='box')
flowchart.edge('D1', 'D2', label='Intersection Found')

# Undo/Redo
flowchart.node('E1', 'Undo (Ctrl+Z)\nPop from undoStack', shape='parallelogram')
flowchart.edge('B', 'E1', label='Ctrl+Z')

flowchart.node('E2', 'Apply Undo\n(revert voxel, update redoStack)', shape='box')
flowchart.edge('E1', 'E2')

flowchart.node('E3', 'Redo (Ctrl+Y)\nPop from redoStack', shape='parallelogram')
flowchart.edge('B', 'E3', label='Ctrl+Y')

flowchart.node('E4', 'Apply Redo\n(reapply voxel, update undoStack)', shape='box')
flowchart.edge('E3', 'E4')

# Save and Load
flowchart.node('F1', 'Save Voxels\n(to localStorage)', shape='box')
flowchart.edge('C3', 'F1')

flowchart.node('F2', 'Load Voxels\n(from localStorage)', shape='box')
flowchart.edge('A', 'F2')

# Render and show the flowchart
flowchart.render('/mnt/data/VoxelEditorFlowchart')
'/mnt/data/VoxelEditorFlowchart.png'
