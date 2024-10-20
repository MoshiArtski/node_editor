import { create } from 'zustand';

const useNodeEditorStore = create((set) => ({
    nodes: [],
    filteredNodes: [],
    states: [],
    constants: [],
    connections: [],

    setNodes: (newNodes) => set({ nodes: newNodes, filteredNodes: newNodes }),

    filterNodes: (searchTerm) => set((state) => ({
        filteredNodes: state.nodes.filter((node) =>
            node.label.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    })),

    addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
    updateNode: (nodeId, updatedNode) => set((state) => ({
        nodes: state.nodes.map((node) => (node.id === nodeId ? updatedNode : node)),
    })),

    setStates: (newStates) => set({ states: newStates }),
    addState: (newState) => set((state) => ({ states: [...state.states, newState] })),
    updateState: (updatedState) => set((state) => ({
        states: state.states.map((state) =>
            state.name === updatedState.name ? updatedState : state
        ),
    })),

    setConstants: (newConstants) => set({ constants: newConstants }),
    addConstant: (newConstant) => set((state) => ({ constants: [...state.constants, newConstant] })),
    updateConstant: (updatedConstant) => set((state) => ({
        constants: state.constants.map((constant) =>
            constant.configName === updatedConstant.configName ? updatedConstant : constant
        ),
    })),

    addConnection: (connection) => set((state) => ({ connections: [...state.connections, connection] })),
    removeConnection: (connectionId) => set((state) => ({
        connections: state.connections.filter((connection) => connection.id !== connectionId),
    })),
}));

export default useNodeEditorStore;
