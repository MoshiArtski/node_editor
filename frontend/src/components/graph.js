'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  Background,
  Controls,
} from 'react-flow-renderer';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';

// Custom dynamic node to handle input and output ports based on backend data
const DynamicNode = ({ data }) => {
  return (
    <div style={styles.node}>
      <strong>{data.label}</strong>
      <Handle type="target" position={Position.Top} style={styles.inputPort} />
      <Handle type="source" position={Position.Bottom} style={styles.outputPort} />
    </div>
  );
};

// Node types registration
const nodeTypes = {
  dynamicNode: DynamicNode,
};

// Main graph component
const Graph = ({ stateFields = [] }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isAnimated, setIsAnimated] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [backendNodeOptions, setBackendNodeOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [nodeProperties, setNodeProperties] = useState([]);
  const reactFlowWrapper = useRef(null);

  // Filter nodes based on search term, ensure backendNodeOptions is an array
  const filteredNodes = Array.isArray(backendNodeOptions)
    ? backendNodeOptions.filter(node =>
        node.node_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Fetch nodes from the backend on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/nodes/')
      .then((response) => response.json())
      .then((data) => {
        // Check if the fetched data is an array
        if (Array.isArray(data)) {
          setBackendNodeOptions(data);
        } else {
          console.error('Fetched data is not an array:', data);
          setBackendNodeOptions([]); // Set to empty array if data is invalid
        }
      })
      .catch((error) => console.error('Error fetching backend nodes:', error));
  }, []);

  // Fetch node properties when a node is selected
  useEffect(() => {
    if (selectedNode?.uuid) {  // Only fetch if we have a UUID
      axios
        .get(`http://127.0.0.1:8000/api/nodes/${selectedNode.uuid}`)
        .then((response) => {
          const configurations = response.data.node?.configurations || {};
          const filteredConfigurations = Object.entries(configurations)
            .filter(([key]) => key !== 'class_attributes')
            .map(([key, value]) => ({
              name: key,
              ...value,
            }));

          setNodeProperties(filteredConfigurations);
        })
        .catch((error) => {
          console.error('Error fetching node properties:', error);
          setNodeProperties([]); // Reset properties on error
        });
    } else {
      setNodeProperties([]); // Reset properties if no UUID
    }
  }, [selectedNode]);

  // Handle node changes (moving, resizing, etc.)
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  // Handle edge changes (connecting, deleting edges)
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({
      ...connection,
      animated: isAnimated,
      markerEnd: { type: 'arrowclosed' }
    }, eds)),
    [setEdges, isAnimated]
  );

  // Handle dragging over the canvas
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle dropping nodes onto the canvas
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const data = event.dataTransfer.getData('text/plain');

      if (!data) return;

      let nodeData;
      try {
        nodeData = JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse node data:', error);
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      // Generate a unique node ID for React Flow
      const uniqueId = `node_${Date.now()}`;

      // Create the new node with both id and uuid
      const newNode = {
        id: uniqueId,
        uuid: nodeData.uuid, // Store the backend UUID
        type: 'dynamicNode',
        position,
        data: {
          label: nodeData.label || 'New Node',
          type: nodeData.type || 'defaultType',
        },
      };

      setNodes((nds) => nds.concat(newNode));

      // Select the newly created node to show its properties
      setSelectedNode(newNode);
      setIsSidebarOpen(true);
    },
    [setNodes, setSelectedNode, setIsSidebarOpen]
  );
  // Handle node click to open the configuration sidebar
  const onNodeClick = useCallback((event, node) => {
    event.stopPropagation(); // Prevent triggering background click
    setSelectedNode(node);
    setIsSidebarOpen(true);
  }, []);

  // Handle right-click to show context menu
  const onContextMenu = useCallback((event) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

    setContextMenu({
      mouseX: event.clientX - reactFlowBounds.left,
      mouseY: event.clientY - reactFlowBounds.top,
    });
    setSearchTerm(''); // Reset search when opening context menu
  }, []);

  // Handle node addition from context menu
  const handleAddNode = useCallback(
    (node) => {
      const uniqueId = `node_${node.id}_${Date.now()}`; // Generate a unique ID

      const newNode = {
        id: uniqueId,  // Unique id for React Flow
        uuid: node.id,  // Save backend UUID separately
        type: 'dynamicNode',
        position: { x: contextMenu.mouseX, y: contextMenu.mouseY },
        data: {
          label: node.node_name,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setContextMenu(null);
    },
    [contextMenu, setNodes]
  );

  // Close sidebar
  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedNode(null);
  };

  const closeContextMenu = () => setContextMenu(null);

  // Handle clicking on the background to close the sidebar
  const onBackgroundClick = () => {
    closeSidebar();
    closeContextMenu();
  };

  return (
      <div className="flex h-full w-full">
          <div
              className="relative flex-grow"
              style={styles.graphContainer}
              ref={reactFlowWrapper}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onContextMenu={onContextMenu}
              onClick={onBackgroundClick}
          >
              <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  nodeTypes={nodeTypes}
                  fitView
              >
                  <Background variant="lines" gap={16} size={1} style={styles.background}/>
                  <Controls/>
              </ReactFlow>

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
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500"/>
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
                                              <Plus className="h-4 w-4 mr-2"/>
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

          {/* Sidebar for Node Configuration */}
          <div
              className={clsx(
                  'transition-all duration-300 ease-in-out w-80 h-full bg-white shadow-lg border-l p-4 overflow-y-auto',
                  isSidebarOpen ? 'block' : 'hidden'
              )}

          >
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Node Configuration</h3>
                  <Button variant="ghost" size="icon" onClick={closeSidebar}>
                      <ChevronRight className="w-4 h-4"/>
                  </Button>
              </div>

              {selectedNode && (
                  <div className="space-y-4">
                      <div>
                          <Label>Node Label</Label>
                          <Input
                              value={selectedNode.data.label}
                              onChange={(e) => {
                                  const updatedNode = {
                                      ...selectedNode,
                                      data: {...selectedNode.data, label: e.target.value},
                                  };
                                  setSelectedNode(updatedNode);
                                  setNodes((nds) =>
                                      nds.map((n) =>
                                          n.id === selectedNode.id
                                              ? {...n, data: {...n.data, label: e.target.value}}
                                              : n
                                      )
                                  );
                              }}
                          />
                      </div>

                      <div className="space-y-2">
                          <Label>Node Properties</Label>
                          {nodeProperties.length > 0 ? (
                              nodeProperties.map((property, index) => (
                                  <div key={index} className="space-y-1">
                                      <Label>{property.name || 'Unnamed Property'}</Label>

                                      {/* Render a Select component if options are available */}
                                      {property.options ? (
                                          <Select
                                              onValueChange={(value) => {
                                                  setSelectedNode((prev) => ({
                                                      ...prev,
                                                      data: {
                                                          ...prev.data,
                                                          [property.name]: value,
                                                      },
                                                  }));
                                                  setNodes((nds) =>
                                                      nds.map((n) =>
                                                          n.id === selectedNode.id
                                                              ? {...n, data: {...n.data, [property.name]: value}}
                                                              : n
                                                      )
                                                  );
                                              }}
                                          >
                                              <SelectTrigger className="w-full">
                                                  <SelectValue placeholder="Select value"/>
                                              </SelectTrigger>
                                              <SelectContent>
                                                  {property.options.map((option, idx) => (
                                                      <SelectItem key={idx} value={option.value}>
                                                          <div className="flex flex-col">
                                                              <span>{option.label}</span>
                                                              <span className="text-xs text-muted-foreground">
                                  {option.description || 'No description'}
                                </span>
                                                          </div>
                                                      </SelectItem>
                                                  ))}
                                              </SelectContent>
                                          </Select>
                                      ) : (
                                          // Render a text input if no options are available
                                          <Input
                                              placeholder={property.description || 'Enter value'}
                                              value={selectedNode.data[property.name] || ''}
                                              onChange={(e) => {
                                                  setSelectedNode((prev) => ({
                                                      ...prev,
                                                      data: {
                                                          ...prev.data,
                                                          [property.name]: e.target.value,
                                                      },
                                                  }));
                                                  setNodes((nds) =>
                                                      nds.map((n) =>
                                                          n.id === selectedNode.id
                                                              ? {
                                                                  ...n,
                                                                  data: {...n.data, [property.name]: e.target.value}
                                                              }
                                                              : n
                                                      )
                                                  );
                                              }}
                                          />
                                      )}
                                  </div>
                              ))
                          ) : (
                              <p>No properties available</p>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
};

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
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E5E7EB',
    width: '240px',
    height: '110px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
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
  },
};

export default Graph;
