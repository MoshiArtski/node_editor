import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Graph-specific nodes and connections
  graphNodes: [],
  connections: [],
  hasChanges: false,

  // Backend fetched nodes and filtering
  availableNodes: [], // Stores nodes fetched from backend

  // States management
  states: [],

  // Constants management
  constants: [],
  constantFiles: [],
};

const nodeEditorSlice = createSlice({
  name: 'nodeEditor',
  initialState,
  reducers: {
        clearAll: (state) => {
      state.graphNodes = [];
      state.connections = [];
      state.states = [];
      state.constants = [];
      state.constantFiles = [];
      state.hasChanges = false;
    },
    // Graph node actions
    setGraphNodes: (state, action) => {
      state.graphNodes = action.payload.map(node => ({
        ...node,
        position: node.position || { x: 0, y: 0 },
      }));
      state.hasChanges = true;
    },
    addGraphNode: (state, action) => {
      state.graphNodes.push(action.payload);
      state.hasChanges = true;
    },
    updateGraphNode: (state, action) => {
      const { nodeId, updatedNode } = action.payload;
      state.graphNodes = state.graphNodes.map((node) =>
        node.id === nodeId ? updatedNode : node
      );
      state.hasChanges = true;
    },
    updateNodeConfigurationById: (state, action) => {
      const { nodeId, updatedConfigurations } = action.payload;
      const nodeIndex = state.graphNodes.findIndex(node => node.id === nodeId);
      if (nodeIndex !== -1) {
        const node = state.graphNodes[nodeIndex];
        if (!node.data.configurations) {
          node.data.configurations = { class_attributes: {} };
        }
        node.data.configurations.class_attributes = {
          ...node.data.configurations.class_attributes,
          ...updatedConfigurations.class_attributes
        };
        state.hasChanges = true;
      }
    },
    removeGraphNode: (state, action) => {
      state.graphNodes = state.graphNodes.filter(node => node.id !== action.payload);
      state.hasChanges = true;
    },

    // Available nodes actions
    setAvailableNodes: (state, action) => {
      state.availableNodes = action.payload;
      state.filteredAvailableNodes = action.payload; // Initialize filtered nodes with all nodes
    },

    // Connection actions
    addConnection: (state, action) => {
      const newConnection = {
        ...action.payload,
        id: `connection-${Date.now()}`, // Ensure unique ID for each connection
      };
      state.connections.push(newConnection);
      state.hasChanges = true;
    },
    removeConnection: (state, action) => {
      state.connections = state.connections.filter(
        (connection) => connection.id !== action.payload
      );
      state.hasChanges = true;
    },
    updateConnection: (state, action) => {
      const { connectionId, updates } = action.payload;
      state.connections = state.connections.map((connection) =>
        connection.id === connectionId ? { ...connection, ...updates } : connection
      );
      state.hasChanges = true;
    },
    setConnections: (state, action) => {
  state.connections = action.payload;
  state.hasChanges = true;
},


    // State management actions
    setStates: (state, action) => {
      state.states = action.payload;
      state.hasChanges = true;
    },
    addState: (state, action) => {
      console.log('Redux: Adding new state:', action.payload);
      state.states.push(action.payload);
      state.hasChanges = true;
    },
updateState: (state, action) => {
  const { uuid, name, description, fields } = action.payload;

  // Find the state by UUID and update its name and other properties
  state.states = state.states.map(s =>
    s.uuid === uuid ? { ...s, name, description, fields } : s
  );
  state.hasChanges = true;
},


    removeState: (state, action) => {
      state.states = state.states.filter(s => s.name !== action.payload);
      state.hasChanges = true;
    },

    // Constants management actions
setConstants: (state, action) => {
  console.log('Setting constants:', action.payload);
  state.constants = action.payload;
  state.hasChanges = true;
},

    addConstant: (state, action) => {
      state.constants.push(action.payload);
      state.hasChanges = true;
    },
updateConstant: (state, action) => {
  const { originalName, configName, name, value, description } = action.payload;

  // Locate the constant to update using the original name and configName
  const constantIndex = state.constants.findIndex(
    (constant) => constant.configName === configName && constant.name === originalName
  );

  if (constantIndex !== -1) {
    // Safely update the constant's values, including the new name
    state.constants[constantIndex] = {
      configName,
      name, // new name is being updated here
      value,
      description
    };
    state.hasChanges = true;
  }
},



    removeConstant: (state, action) => {
      state.constants = state.constants.filter(
        constant => constant.configName !== action.payload
      );
      state.hasChanges = true;
    },

    // Constant files management actions
addConstantFile: (state, action) => {
  console.log('Adding constant file:', action.payload);  // Log the payload for debugging
  state.constantFiles.push(action.payload);  // Add constant file to state
  state.constants.push(...action.payload.constants);  // Add constants to the constants array
  state.hasChanges = true;
},
updateConstantFile: (state, action) => {
  const index = state.constantFiles.findIndex(file => file.configName === action.payload.configName);
  if (index !== -1) {
    console.log('Updating constant file:', action.payload);
    state.constantFiles[index] = action.payload;

    // Remove the constants related to this file and add the updated ones
    state.constants = state.constants.filter(
      constant => constant.configName !== action.payload.configName
    );
    state.constants.push(...action.payload.constants);
    state.hasChanges = true;
  }
},
    addConstantFiles: (state, action) => {
  console.log('Adding multiple constant files:', action.payload);  // Log the payload for debugging
  action.payload.forEach(file => {
    state.constantFiles.push(file);  // Add each constant file to state
    state.constants.push(...file.constants);  // Add constants from each file to the constants array
  });
  state.hasChanges = true;
},

    removeConstantFile: (state, action) => {
      const fileToRemove = state.constantFiles.find(
        file => file.configName === action.payload
      );
      if (fileToRemove) {
        // Remove the constants associated with this file
        state.constants = state.constants.filter(constant =>
          !fileToRemove.constants.some(
            fileConstant => fileConstant.name === constant.name
          )
        );
        // Remove the file itself
        state.constantFiles = state.constantFiles.filter(
          file => file.configName !== action.payload
        );
      }
      state.hasChanges = true;
    },

    // Changes tracking actions
    setHasChanges: (state, action) => {
      state.hasChanges = action.payload;
    },
    resetChanges: (state) => {
      state.hasChanges = false;
    },

    // Utility actions
    resetState: (state) => {
      return initialState;
    },
    importState: (state, action) => {
      return { ...state, ...action.payload };
    }
  },
});

export const {
  // Graph node actions
  setGraphNodes,
  addGraphNode,
  updateGraphNode,
  updateNodeConfigurationById, // Added action here
  removeGraphNode,

  // Available nodes actions
  setAvailableNodes,

  // Connection actions
  addConnection,
  removeConnection,
  updateConnection,
      setConnections,

  // State management actions
  setStates,
  addState,
  updateState,
  removeState,

  // Constants management actions
  setConstants,
  addConstant,
  updateConstant,
  removeConstant,
addConstantFiles,
  // Constant files management actions
  addConstantFile,
  updateConstantFile,
  removeConstantFile,

  // Changes tracking actions
  setHasChanges,
  resetChanges,

  // Utility actions
  resetState,
  importState,
    clearAll,
} = nodeEditorSlice.actions;

// Selectors
export const selectGraphNodes = (state) => state.nodeEditor.graphNodes;
export const selectConnections = (state) => state.nodeEditor.connections;
export const selectAvailableNodes = (state) => state.nodeEditor.availableNodes;
export const selectStates = (state) => state.nodeEditor.states;
export const selectConstants = (state) => state.nodeEditor.constants;
export const selectConstantFiles = (state) => state.nodeEditor.constantFiles;
export const selectHasChanges = (state) => state.nodeEditor.hasChanges;

export default nodeEditorSlice.reducer;
