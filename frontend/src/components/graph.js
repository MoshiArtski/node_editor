"use client"


import React, {useCallback, useRef, useEffect, useState, useReducer} from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  Background,
  Controls,
} from 'react-flow-renderer';
import { isEqual } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import {
  setGraphNodes,
  addGraphNode,
  updateGraphNode,
  updateNodeConfigurationById,
  removeGraphNode,
  addConnection,
  removeConnection,
  setAvailableNodes,
  selectGraphNodes,
  selectConnections,
  selectAvailableNodes,
} from '@/store/nodeEditorSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import NodeConfigurationSidebar from "@/components/node-configuration-sidebar";


// Custom ConditionalNode Component
const ConditionalNode = ({ data, id }) => (
  <div style={conditionalNodeStyles.node}>
    <strong>{data.label}</strong>
    <Handle type="target" position={Position.Top} style={conditionalNodeStyles.inputPort} />
    <Handle type="source" position={Position.Bottom} id="true" style={conditionalNodeStyles.trueOutputPort} />
    <Handle type="source" position={Position.Bottom} id="false" style={conditionalNodeStyles.falseOutputPort} />
  </div>
);

// Custom DynamicNode Component
const DynamicNode = ({ data }) => (
  <div style={styles.node}>
    <strong>{data.label}</strong>
    <Handle type="target" position={Position.Top} style={styles.inputPort} />
    <Handle type="source" position={Position.Bottom} style={styles.outputPort} />
  </div>
);

// Node types registration
const nodeTypes = {
  dynamicNode: DynamicNode,
  conditionalNode: ConditionalNode,
};

const Graph = ({ stateFields = [] }) => {
  const dispatch = useDispatch();
const [, forceUpdate] = useReducer(x => x + 1, 0);
  // Redux selectors
  const graphNodes = useSelector(selectGraphNodes);
  const connections = useSelector(selectConnections);
  const availableNodes = useSelector(selectAvailableNodes);

  // Local state
  const [isAnimated, setIsAnimated] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const reactFlowWrapper = useRef(null);
  const [filteredNodes, setFilteredNodes] = useState(availableNodes);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch available nodes and configurations on mount
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/nodes/');
        console.log('Fetched nodes:', response.data); // Add this line to log the response data
        if (Array.isArray(response.data)) {
          const nodesWithConfigurations = response.data.map(node => ({
            ...node,
            configurations: node.configurations || [],
          }));
          console.log('Nodes with configurations:', nodesWithConfigurations); // Add this line to log processed nodes
          dispatch(setAvailableNodes(nodesWithConfigurations));
        } else {
          console.log('Invalid response data structure:', response.data); // Log unexpected data structure
          dispatch(setAvailableNodes([]));
        }
      } catch (error) {
        console.error('Error fetching nodes:', error);
        dispatch(setAvailableNodes([]));
      }
    };

    fetchNodes();
  }, [dispatch]);

  // Update filtered nodes when search term changes
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    setFilteredNodes(
      availableNodes.filter(node =>
        node.node_name.toLowerCase().includes(lowercasedSearchTerm)
      )
    );
  }, [searchTerm, availableNodes]);

  // Add example conditional node on mount
  useEffect(() => {
    const exampleNode = {
      id: `node_conditional_${Date.now()}`,
      uuid: `node_uuid_${crypto.randomUUID()}`,
      type: 'conditionalNode',
      position: { x: 250, y: 150 },
      data: {
        label: 'Example Conditional Node',
      },
    };
    dispatch(addGraphNode(exampleNode));
  }, [dispatch]);

const onNodesChange = useCallback(
  (changes) => {
    const updatedNodes = applyNodeChanges(changes, graphNodes);

    // Check if nodes are truly different before dispatching to avoid infinite loops
    if (!isEqual(updatedNodes, graphNodes)) {
      dispatch(setGraphNodes(updatedNodes));
    }
  },
  [dispatch, graphNodes]
);


  // Edge change handlers
  const onEdgesChange = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, connections);
      dispatch(setGraphNodes([...graphNodes]));
    },
    [dispatch, graphNodes, connections]
  );

  // Connection handler
  const onConnect = useCallback(
    (connection) => {
      const newConnection = {
        ...connection,
        animated: isAnimated,
        markerEnd: { type: 'arrowclosed' },
        condition: connection.sourceHandle === 'true' ? 'ifTrue' : 'ifFalse',
      };
      dispatch(addConnection(newConnection));
    },
    [dispatch, isAnimated]
  );

  // Drop handler
const onDrop = useCallback(
  (event) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const data = event.dataTransfer.getData('text/plain');

    if (!data) return;

    try {
      const nodeData = JSON.parse(data);

      // Ensure that the node configurations are properly assigned
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      // Add configurations here from nodeData
      const configArray = nodeData.configurations
        ? Object.entries(nodeData.configurations).map(([key, value]) => ({
            key,
            value: value.default || '',
            description: value.description || '',
            type: value.type || 'string',
          }))
        : [];

      const newNode = {
        id: `node_${Date.now()}`,
        uuid: nodeData.uuid,
        type: nodeData.type || 'dynamicNode', // Default type to prevent undefined
        position,
        data: {
          label: nodeData.label || 'New Node',
          configurations: configArray, // Ensure configurations are added here
        },
      };

      dispatch(addGraphNode(newNode));
    } catch (error) {
      console.error('Failed to parse node data:', error);
    }
  },
  [dispatch]
);


// Node click handler
const onNodeClick = useCallback((event, node) => {
  console.log("Clicked node:", node);
  // Fetch the latest node data from the Redux store
  const updatedNode = graphNodes.find(n => n.id === node.id);
  setSelectedNode(updatedNode || node);
  setIsSidebarOpen(true);
}, [graphNodes]);


useEffect(() => {
  if (selectedNode && selectedNode.data && selectedNode.data.configurations) {
    setIsSidebarOpen(true);
    // Force a re-render
    forceUpdate({});
  }
}, [selectedNode]);


  // Context menu handlers
  const onContextMenu = useCallback((event) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    setContextMenu({
      mouseX: event.clientX - reactFlowBounds.left,
      mouseY: event.clientY - reactFlowBounds.top,
    });
    setSearchTerm('');
  }, []);

const handleAddNode = useCallback(
  (node) => {
    const newNode = {
      id: `node_${Date.now()}`,
      uuid: node.id,
      type: node.type === 'conditional' ? 'conditionalNode' : 'dynamicNode',
      position: { x: contextMenu.mouseX, y: contextMenu.mouseY },
      data: {
        label: node.node_name,
        type: node.type,
        configurations: node.configurations || {}, // Ensure configurations are added here
      },
    };
    dispatch(addGraphNode(newNode));
    setContextMenu(null);
  },
  [contextMenu, dispatch]
);


  const closeContextMenu = () => setContextMenu(null);
const onBackgroundClick = () => {
  closeContextMenu();
  setIsSidebarOpen(false); // Close sidebar when clicking the background
};


  // Configuration Sidebar Handlers
const handleConfigChange = useCallback((nodeId, key, field, newValue) => {
  dispatch(updateNodeConfigurationById({
    nodeId,
    updatedConfigurations: {
      class_attributes: {
        [key]: {
          [field]: newValue
        }
      }
    }
  }));

  // Update the local state of the selected node
  setSelectedNode(prevNode => {
    if (prevNode && prevNode.id === nodeId) {
      return {
        ...prevNode,
        data: {
          ...prevNode.data,
          configurations: {
            ...prevNode.data.configurations,
            class_attributes: {
              ...prevNode.data.configurations.class_attributes,
              [key]: {
                ...prevNode.data.configurations.class_attributes[key],
                [field]: newValue
              }
            }
          }
        }
      };
    }
    return prevNode;
  });
}, [dispatch]);
  const saveConfigChanges = useCallback(() => {
    if (selectedNode) {
      dispatch(updateGraphNode(selectedNode));
      setIsSidebarOpen(false);
    }
  }, [dispatch, selectedNode]);


  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-full w-full">
      <div
        className="relative flex-grow"
        style={styles.graphContainer}
        ref={reactFlowWrapper}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onContextMenu={onContextMenu}
        onClick={onBackgroundClick}
      >
        <ReactFlow
          nodes={graphNodes}
          edges={connections}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant="lines" gap={16} size={1} style={styles.background} />
          <Controls />
        </ReactFlow>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 w-64 p-4 z-50"
            style={{
              top: contextMenu.mouseY,
              left: contextMenu.mouseX,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Add Node</h3>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search nodes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {filteredNodes.map((node, index) => (
                    <div key={index} className="w-full">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => handleAddNode(node)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {node.node_name}
                      </Button>
                    </div>
                  ))}
                  {filteredNodes.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No nodes found
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Sidebar */}
      <NodeConfigurationSidebar
        selectedNode={selectedNode}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onConfigChange={handleConfigChange}
        onSave={saveConfigChanges}
      />
    </div>
  );
};

// Styles
const styles = {
  graphContainer: {
    height: '100vh',
    width: '100%',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  background: {
    stroke: '#D1D5DB',
  },
  node: {
    background: '#F9FAFB',
    color: '#1F2937',
    padding: '18px 22px',
    borderRadius: '16px',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    border: '1px solid #E5E7EB',
    width: '240px',
    height: '110px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    transition: 'transform 0.15s ease-out',
  },
  inputPort: {
    width: 0,
    height: 0,
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
    borderTop: '18px solid #34D399',
    position: 'absolute',
    top: '-22px',
    left: '50%',
    transform: 'translateX(-50%)',
    transition: 'transform 0.15s ease-out',
  },
  outputPort: {
    width: 0,
    height: 0,
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
    borderTop: '18px solid #FB7185',
    position: 'absolute',
    bottom: '-22px',
    left: '50%',
    transform: 'translateX(-50%)',
    transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
  },
};

// Styles for conditional nodes
const conditionalNodeStyles = {
  node: {
    background: '#FEF3C7',
    color: '#1F2937',
    padding: '16px 20px',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
    border: '2px solid #FBBF24',
    width: '260px',
    height: '120px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    transform: 'translate3d(0,0,0)',
    backfaceVisibility: 'hidden',
    perspective: 1000,
  },
  inputPort: {
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderTop: '16px solid #34D399',
    position: 'absolute',
    top: '-20px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  trueOutputPort: {
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderTop: '16px solid #4ADE80',
    position: 'absolute',
    bottom: '-20px',
    left: '35%',
    transform: 'translateX(-50%)',
  },
  falseOutputPort: {
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderTop: '16px solid #F87171',
    position: 'absolute',
    bottom: '-20px',
    right: '35%',
    transform: 'translateX(50%)',
  },
};

export default Graph;
