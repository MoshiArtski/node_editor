// src/store/nodeEditorStore.js
import { create } from 'zustand';

const useNodeEditorStore = create((set) => ({
    nodes: [],
    connections: [],
    addNode: (node) =>
        set((state) => ({
            nodes: [...state.nodes, node],
        })),
    updateNode: (nodeId, updatedNode) =>
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId ? updatedNode : node
            ),
        })),
    addConnection: (connection) =>
        set((state) => ({
            connections: [...state.connections, connection],
        })),
    removeConnection: (connectionId) =>
        set((state) => ({
            connections: state.connections.filter(
                (connection) => connection.id !== connectionId
            ),
        })),
}));

export default useNodeEditorStore;
