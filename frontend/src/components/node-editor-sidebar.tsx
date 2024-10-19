'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import axios from 'axios'
import {
  ChevronRight,
  ChevronLeft,
  Boxes,
  Sliders,
  FolderOpen,
  Plus,
  FileCode,
  RefreshCw,
  Search
} from "lucide-react";

import { AddNodeModal } from "@/components/AddNodeModal"
import { StateCreationModalComponent } from './state-creation-modal'

// Type definitions
interface StateField {
  name: string
  type: string
  comment: string
}

interface CustomState {
  name: string
  description: string
  fields: StateField[]
}

type MenuType = 'nodes' | 'properties' | 'assets' | 'states'

export function NodeEditorSidebarComponent() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeMenu, setActiveMenu] = useState<MenuType>('nodes')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStateModalOpen, setIsStateModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [nodes, setNodes] = useState([])
  const [filteredNodes, setFilteredNodes] = useState(nodes)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [states, setStates] = useState<CustomState[]>([])
  const [currentState, setCurrentState] = useState<CustomState>({
    name: '',
    description: '',
    fields: []
  })

  const fetchNodes = async () => {
    setIsLoading(true);
    setNodes([]);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/nodes/');
      const fetchedNodes = response.data.map((node) => ({
        type: node.type || 'defaultNodeType',
        icon: <FileCode className="w-4 h-4" />,
        label: node.node_name || 'Unnamed Node',
        uuid: node.id || node.uuid, // Store the backend UUID
      }));
      setNodes(fetchedNodes);
      setFilteredNodes(fetchedNodes);
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'nodes') {
      fetchNodes()
    }
  }, [activeMenu])

  useEffect(() => {
    setFilteredNodes(
      nodes.filter((node) =>
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [searchTerm, nodes])

  const handleSaveState = (savedState: CustomState) => {
    if (isEditing) {
      setStates(prev => prev.map(state =>
        state.name === savedState.name ? savedState : state
      ))
    } else {
      setStates(prev => [...prev, savedState])
    }
    setIsStateModalOpen(false)
    setIsEditing(false)
  }

  const handleEditState = (state: CustomState) => {
    setCurrentState(state)
    setIsEditing(true)
    setIsStateModalOpen(true)
  }

  const toggleSidebar = () => setIsOpen(!isOpen)

  const menuItems = {
    nodes: filteredNodes,
    properties: [
      { icon: <Sliders className="w-4 h-4" />, label: 'Node Settings' },
      { icon: <Plus className="w-4 h-4" />, label: 'Add Property' },
      { icon: <Plus className="w-4 h-4" />, label: 'Add New Node', action: () => setIsModalOpen(true) },
    ],
    assets: [
      { icon: <FolderOpen className="w-4 h-4" />, label: 'Images' },
      { icon: <FolderOpen className="w-4 h-4" />, label: 'Scripts' },
    ],
    states: states.map(state => ({
      icon: <FileCode className="w-4 h-4" />,
      label: state.name,
      action: () => handleEditState(state),
      onDoubleClick: () => handleEditState(state)
    }))
  }

  const handleAddNode = (nodeName: string, nodeCode: string) => {
    const iconElement = <FileCode className="w-4 h-4" />
    setNodes(prevNodes => [...prevNodes, { label: nodeName, type: 'custom', icon: iconElement }])
    setFilteredNodes(prevNodes => [...prevNodes, { label: nodeName, type: 'custom', icon: iconElement }])
    setIsModalOpen(false)
  }

  return (
    <TooltipProvider>
      <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-background border-r z-40 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex h-full">
          {/* Sidebar Toggle and Menu Buttons */}
          <div className="flex flex-col items-center py-4 bg-muted">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mb-4">
                  {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              </TooltipContent>
            </Tooltip>
            {['nodes', 'properties', 'assets', 'states'].map((menu) => (
              <Tooltip key={menu}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeMenu === menu ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => {
                      setActiveMenu(menu as MenuType)
                      setIsOpen(true)
                    }}
                  >
                    {menu === 'nodes' && <Boxes className="w-4 h-4" />}
                    {menu === 'properties' && <Sliders className="w-4 h-4" />}
                    {menu === 'assets' && <FolderOpen className="w-4 h-4" />}
                    {menu === 'states' && <FileCode className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {menu.charAt(0).toUpperCase() + menu.slice(1)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Main Content Area */}
          {isOpen && (
            <div className="flex-1 p-4 overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold capitalize">{activeMenu}</h2>
                {activeMenu === 'nodes' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchNodes}
                        disabled={isLoading}
                        className="transition-transform hover:rotate-180 flex-shrink-0"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh nodes</TooltipContent>
                  </Tooltip>
                )}
                {activeMenu === 'states' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentState({ name: '', description: '', fields: [] })
                          setIsEditing(false)
                          setIsStateModalOpen(true)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add new state</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Search Input */}
              {activeMenu === 'nodes' && (
                <div className="relative mb-4">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search Nodes"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              )}

              {/* Content Area */}
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="pr-4">
                  {activeMenu === 'states' && menuItems.states.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <p>No states created yet</p>
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => setIsStateModalOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Create State
                      </Button>
                    </div>
                  ) : (
                    menuItems[activeMenu].map((item, index) => (
      <Button
        key={index}
        variant="ghost"
        className="w-full justify-start mb-2 group relative"
        onClick={item.action}
        draggable={activeMenu === 'nodes'}
        onDragStart={activeMenu === 'nodes' ? (event) => {
          event.dataTransfer.setData('text/plain', JSON.stringify({
            type: item.type || 'defaultType',
            label: item.label,
            uuid: item.uuid, // Include the backend UUID in the drag data
          }));
        } : undefined}
                      >
                        <span className="flex-shrink-0">
                          {item.icon}
                        </span>
                        <span className="ml-2 truncate overflow-hidden text-ellipsis max-w-[160px]">
                          {item.label}
                        </span>
                        {/* Tooltip for long names */}
                        {item.label && item.label.length > 20 && (
                          <Tooltip>
                            <TooltipTrigger className="hidden group-hover:block absolute inset-0" />
                            <TooltipContent side="right">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </Button>
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
          onAddNode={handleAddNode}
        />
        <StateCreationModalComponent
          isOpen={isStateModalOpen}
          onClose={() => setIsStateModalOpen(false)}
          initialState={currentState}
          onSave={handleSaveState}
          isEditing={isEditing}
        />
      </div>
    </TooltipProvider>
  )
}