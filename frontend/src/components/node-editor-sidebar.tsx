'use client';

import { Trash2 } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import dynamic from 'next/dynamic';
import { fetchUpdatedStates, setAvailableNodes, removeState } from '@/store/nodeEditorSlice';
import axios from 'axios';
import {
  ChevronRight,
  ChevronLeft,
  Boxes,
  FileCode,
  RefreshCw,
  Search,
  Settings,
  Plus,
} from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import {
  setNodes,
  addState,
  updateState,
  addConstantFile,
  updateConstantFile,
  selectAvailableNodes
} from '@/store/nodeEditorSlice';


const AddNodeModal = dynamic(() => import('@/components/add-node-modal').then((mod) => mod.AddNodeModal));
const StateCreationModalComponent = dynamic(() => import('./state-creation-modal').then((mod) => mod.StateCreationModalComponent));
const AddConstantModal = dynamic(() => import('./add-constant-modal').then((mod) => mod.AddConstantModal));

type MenuType = 'nodes' | 'states' | 'constants';

interface MenuItem {
  type: MenuType;
  icon: JSX.Element;
  label: string;
}

interface ListItem {
  uuid: string;
  label: string;
  type?: string;
  iconType?: string;
  node_name?: string; // Added to match API response
  id?: string; // Added to match API response
}

interface saveStateItem {
  name: string;
  description: string;
  fields: Array<any>;  // Adjust this according to the actual field type
  imports: Array<string>;
  customFunctions?: string;  // Optional field
}

interface RootState {
  nodeEditor: {
    nodes: ListItem[];
    states: ListItem[];
    constants: ListItem[];
    constantFiles: any[];
    availableNodes: ListItem[]; // Added for available nodes
  };
}

export function NodeEditorSidebarComponent() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<MenuType>('nodes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isConstantModalOpen, setIsConstantModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedConstantFile, setSelectedConstantFile] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedState, setSelectedState] = useState<saveStateItem | null>(null);
  const [filteredNodes, setFilteredNodes] = useState<ListItem[]>([]);

  const dispatch = useDispatch();
  const availableNodes = useSelector(selectAvailableNodes);
  const states = useSelector((state: RootState) => state.nodeEditor.states ?? []);
  const constants = useSelector((state: RootState) => state.nodeEditor.constants ?? []);
  const constantFiles = useSelector((state: RootState) => state.nodeEditor.constantFiles ?? []);

  const menuItems: MenuItem[] = [
    { type: 'nodes', icon: <Boxes className="w-4 h-4" />, label: 'Nodes' },
    { type: 'states', icon: <FileCode className="w-4 h-4" />, label: 'States' },
    { type: 'constants', icon: <Settings className="w-4 h-4" />, label: 'Constants' }
  ];

    // Update filtered nodes when search term changes
  useEffect(() => {
    const filterNodes = () => {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      setFilteredNodes(
        availableNodes.filter((node) =>
          node.node_name?.toLowerCase().includes(lowercasedSearchTerm)
        )
      );
    };

    filterNodes();
  }, [searchTerm, availableNodes]);

  const validateNode = (item: any) => {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.uuid === 'string' &&
      typeof item.type === 'string' &&
      typeof item.position === 'object' &&
      item.position.hasOwnProperty('x') &&
      item.position.hasOwnProperty('y') &&
      typeof item.data === 'object' &&
      typeof item.data.label === 'string'
    );
  };

  const validateListItem = (item: any) => {
    if (!item || typeof item !== 'object') return false;

    // For nodes from API
    if (item.node_name) {
      return true;
    }

    // For other list items
    return (
      typeof item.uuid === 'string' &&
      (typeof item.label === 'string' || typeof item.node_name === 'string')
    );
  };

  const filterItems = useCallback((items: ListItem[]) => {
    const searchLower = searchTerm.toLowerCase();
    return (items || []).filter((item) => {
      if (!validateListItem(item)) return false;

      // Use node_name for nodes, label for other items
      const searchText = item.node_name || item.label;
      return searchText.toLowerCase().includes(searchLower);
    });
  }, [searchTerm]);

  const getCurrentItems = useCallback(() => {
    switch (activeMenu) {
      case 'nodes':
        return filteredNodes;
      case 'states':
        return filterItems(states);
      case 'constants':
        return filterItems(constantFiles.map(file => ({
          uuid: file.configName,
          label: file.configName,
          type: 'constantFile'
        })));
      default:
        return [];
    }
  }, [activeMenu, filteredNodes, states, constantFiles, filterItems]);

  const currentItems = useMemo(() => {
    return getCurrentItems();
  }, [getCurrentItems]);

  useEffect(() => {
  if (activeMenu === 'states' || activeMenu === 'constants') {
    getCurrentItems(); // Trigger filtering or update logic
  }
}, [states, constants, activeMenu]);


  const fetchNodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/nodes/');
      if (Array.isArray(response.data)) {
        // Transform the API response to match the expected format
        const transformedNodes = response.data.map(node => ({
          ...node,
          uuid: node.id || crypto.randomUUID(), // Use API id or generate new UUID
          label: node.node_name, // Use node_name as label
          type: node.type || 'dynamicNode',
          iconType: 'boxes' // Default icon type for nodes
        }));
        dispatch(setAvailableNodes(transformedNodes));
      } else {
        console.error('Fetched data is not an array:', response.data);
        dispatch(setAvailableNodes([]));
      }
    } catch (error) {
      console.error('Error fetching nodes:', error);
      dispatch(setAvailableNodes([]));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  // Custom validation function for saveStateItem
const validateSaveStateItem = (state: any): boolean => {
  if (!state || typeof state !== 'object') {
    console.error('State is not an object or is null:', state);
    return false;
  }

  // Validate 'name' (must be a non-empty string)
  if (typeof state.name !== 'string' || state.name.trim() === '') {
    console.error('Invalid name:', state.name);
    return false;
  }

  // Validate 'description' (must be a non-empty string)
  if (typeof state.description !== 'string' || state.description.trim() === '') {
    console.error('Invalid description:', state.description);
    return false;
  }

  // Validate 'fields' (must be a non-empty array)
  if (!Array.isArray(state.fields) || state.fields.length === 0) {
    console.error('Fields should be a non-empty array:', state.fields);
    return false;
  }

  // Validate each field in 'fields' array (basic check for non-empty 'name' and 'type' properties)
  for (const field of state.fields) {
    if (typeof field !== 'object' || !field.name || !field.type) {
      console.error('Invalid field:', field);
      return false;
    }
  }

  // Validate 'imports' (must be an array of strings)
  if (!Array.isArray(state.imports) || state.imports.some((imp) => typeof imp !== 'string')) {
    console.error('Imports should be an array of strings:', state.imports);
    return false;
  }

  // Validate 'customFunctions' (optional, but if present, must be a string)
  if (state.customFunctions !== undefined && typeof state.customFunctions !== 'string') {
    console.error('Custom functions should be a string:', state.customFunctions);
    return false;
  }

  // Generate 'uuid' and 'label' for sidebar usage
  if (!state.uuid) {
    state.uuid = crypto.randomUUID();  // Ensure each state has a UUID
  }

  if (!state.label) {
    state.label = state.name;  // Use 'name' as the 'label' for filtering
  }

  // If all checks pass, return true
  return true;
};

const handleSaveState = useCallback(
  (savedState: saveStateItem) => {
    if (!validateSaveStateItem(savedState)) {
      console.error('Invalid state data:', savedState);
      return;
    }

    if (isEditing) {
      dispatch(updateState(savedState));  // Update existing state
    } else {
      dispatch(addState(savedState));  // Add new state
    }

    setIsStateModalOpen(false);  // Close modal
    setIsEditing(false);  // Reset editing state
  },
  [dispatch, isEditing]
);


  const handleSaveConstant = useCallback((savedConstantFile: any) => {
    if (isEditing) {
      dispatch(updateConstantFile(savedConstantFile));
    } else {
      dispatch(addConstantFile(savedConstantFile));
    }
    setIsConstantModalOpen(false);
    setIsEditing(false);
    setSelectedConstantFile(null);
  }, [dispatch, isEditing]);

const handleEditConstantFile = useCallback((constantFile: ListItem) => {
  const fileToEdit = constantFiles.find(file => file.configName === constantFile.uuid);

  if (fileToEdit) {
    setIsEditing(true);
    setSelectedConstantFile(fileToEdit);
    setIsConstantModalOpen(true); // Open modal for editing
  }
}, [constantFiles]);


  useEffect(() => {
    if (activeMenu === 'nodes') {
      fetchNodes();
    }
  }, [activeMenu, fetchNodes]);

  const iconMap: Record<string, JSX.Element> = {
    fileCode: <FileCode className="w-4 h-4" />,
    settings: <Settings className="w-4 h-4" />,
    boxes: <Boxes className="w-4 h-4" />,
  };

const ListItemComponent = ({ item }: { item: ListItem }) => {
  if (!validateListItem(item)) {
    console.warn('Invalid item:', item);
    return null;
  }

useEffect(() => {
  console.log("states changed.")
  // This will trigger a re-render whenever the states array changes
}, [states]);


  const handleClick = () => {
    if (activeMenu === 'states') {
      const stateToEdit = states.find(state => state.uuid === item.uuid);
      if (stateToEdit) {
        setIsEditing(true);
        setSelectedState(stateToEdit);
        setIsStateModalOpen(true);
      }
    }
  };

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete the state "${item.label}"?`)) {
      dispatch(removeState(item.name)); // Ensure the state is identified by 'name'
    }
  };

  return (
    <div className="flex justify-between items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start group relative hover:bg-muted px-2"
            onClick={handleClick} // Use the handleClick function
          >
            <div className="flex items-center w-full min-w-0">
              <span className="flex-shrink-0">
                {iconMap[item.iconType || 'boxes']}
              </span>
              <span className="ml-2 truncate text-sm">
                {item.node_name || item.label}
              </span>
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[300px]">
          <p className="break-all text-sm">{item.node_name || item.label}</p>
        </TooltipContent>
      </Tooltip>

      <Button variant="ghost" className="ml-2" onClick={handleDeleteClick}>
        <Trash2 className="w-4 h-4 text-red-600" />
      </Button>
    </div>
  );
};


  return (
    <TooltipProvider>
      <div
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-background border-r z-40 transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-16'}`}
      >
        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <div className="flex flex-col items-center py-4 bg-muted w-16 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(prev => !prev)}
              className="mb-4 hover:bg-muted-foreground/20"
            >
              {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>

            {menuItems.map(({ type, icon, label }) => (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeMenu === type ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => {
                      setActiveMenu(type);
                      setIsOpen(true);
                    }}
                    className="mb-2 hover:bg-muted-foreground/20"
                  >
                    {icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Main Content Area */}
          {isOpen && (
            <div className="flex-1 flex flex-col min-w-0 max-w-[calc(100%-4rem)]">
              <div className="p-4 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold capitalize">{activeMenu}</h2>
                  {activeMenu === 'nodes' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchNodes}
                      disabled={isLoading}
                      className="transition-transform hover:rotate-180 flex-shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>

                {/* Search and Add Buttons */}
                <div className="space-y-2 mb-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-8"
                    />
                  </div>

                  {activeMenu === 'nodes' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsModalOpen(true)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add New Node
                    </Button>
                  )}

                  {activeMenu === 'states' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStateModalOpen(true)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add New State
                    </Button>
                  )}

                  {activeMenu === 'constants' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConstantFile(null);
                        setIsEditing(false);
                        setIsConstantModalOpen(true);
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add New Constant
                    </Button>
                  )}
                </div>
              </div>

              {/* Item List */}
              <ScrollArea className="flex-1 w-full">
                <div className="px-4 pb-4 space-y-1">
                  {currentItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <p>No items found</p>
                    </div>
                  ) : (
                    currentItems.map((item: ListItem) => (
                      <ListItemComponent key={item.uuid} item={item} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Modals */}
        <AddNodeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
<StateCreationModalComponent
  isOpen={isStateModalOpen}
  onClose={() => setIsStateModalOpen(false)}
  initialState={selectedState}  // Pass the selected state for editing
  onSave={handleSaveState}
  isEditing={isEditing}
/>


<AddConstantModal
  isOpen={isConstantModalOpen}
  onClose={() => setIsConstantModalOpen(false)}
  initialFile={isEditing ? selectedConstantFile : null} // Pass selected file for editing
  onSave={handleSaveConstant}
  isEditing={isEditing}
/>

      </div>
    </TooltipProvider>
  );
}
