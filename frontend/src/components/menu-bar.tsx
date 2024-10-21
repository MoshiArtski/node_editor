"use client";

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FilePlus, LogOut, User, Loader2, ChevronDown, FolderOpen, Save, Trash2, Settings, RefreshCw, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useToast } from "@/hooks/use-toast";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from 'axios';
import { selectActiveProject, setActiveProject } from '@/store/projectSlice';
import { useAuth } from '@/hooks/useAuth';
import Cookies from 'js-cookie';
import {
  selectGraphNodes,
  selectConnections,
  selectStates,
  selectConstants,
  setGraphNodes,
  updateConnections,
  setStates,
  setConstants,
  clearAll,
  setConnections, selectConstantFiles, addConstantFile, addConstantFiles
} from '@/store/nodeEditorSlice';

export function MenuBarComponent() {
  const { user, setUser, signIn, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const activeProject = useSelector(selectActiveProject);
  const graphNodes = useSelector(selectGraphNodes);
  const connections = useSelector(selectConnections);
  const states = useSelector(selectStates);
  const constantFiles = useSelector(selectConstantFiles);  // Add this line to retrieve constantFiles

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isOpenProjectsDialogOpen, setIsOpenProjectsDialogOpen] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const API_PROJECT_MANAGER_URL = process.env.NEXT_PUBLIC_API_PROJECT_MANAGER_URL || 'http://127.0.0.1:8004/projects';

  useEffect(() => {
    const loadUserFromCookies = () => {
      const storedUser = Cookies.get("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Error parsing stored user:", error);
          Cookies.remove("user");
          Cookies.remove("accessToken");
          Cookies.remove("refreshToken");
        }
      }
    };
    loadUserFromCookies();
  }, [setUser]);

  const handleCreateProject = async () => {
    if (!user?.user_id) {
      toast({
        title: "Error",
        description: "User ID not found. Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    setIsProjectLoading(true);
    try {
      const response = await axios.post(`${API_PROJECT_MANAGER_URL}/create`, {
        user_id: user.user_id,
        name: projectName,
        description: projectDescription,
      });

      if (response.data && response.data.data) {
        toast({
          title: "Project Created",
          description: `Project "${projectName}" has been created.`,
        });

        const createdProject = response.data.data;
        dispatch(setActiveProject(createdProject));
        dispatch(clearAll()); // Clear all existing project state
        setProjectName('');
        setProjectDescription('');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      toast({
        title: "Error Creating Project",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProjectLoading(false);
      setIsProjectDialogOpen(false);
    }
  };

const handleSaveProject = async () => {
  if (!activeProject) {
    toast({
      title: "No Project Selected",
      description: "Please select or create a project first.",
      variant: "destructive",
    });
    return;
  }

  // Debugging: Log the active project
  console.log("Saving project:", activeProject);

  // Debugging: Log the current state of nodes, connections, states, and constants
  console.log("Current graphNodes:", graphNodes);
  console.log("Current connections:", connections);
  console.log("Current states:", states);
  console.log("Current constants:", constantFiles);

  setIsProjectLoading(true);
  try {
    await axios.put(`${API_PROJECT_MANAGER_URL}/update/${activeProject.id}`, {
      content: {
        nodes: graphNodes,
        connections: connections,
        states: states,
        constants: constantFiles,  // Ensure constantFiles are being sent
      },
    });

    // Debugging: Confirm successful save
    console.log("Project saved successfully");

    toast({
      title: "Project Saved",
      description: `Project "${activeProject.name}" has been saved.`,
    });
  } catch (error) {
    // Debugging: Log any error that occurs during the save process
    console.error("Error saving project:", error);

    toast({
      title: "Error Saving Project",
      description: error.response?.data?.error || "An error occurred.",
      variant: "destructive",
    });
  } finally {
    setIsProjectLoading(false);
  }
};


  const handleOpenProjects = async () => {
    if (!user?.user_id) {
      toast({
        title: "Error",
        description: "User ID not found. Please sign in again.",
        variant: "destructive",
      });
      return;
    }
    setIsProjectLoading(true);
    try {
      const response = await axios.get(`${API_PROJECT_MANAGER_URL}/user/${user.user_id}/projects`);
      if (response.data && response.data.data) {
        setAllProjects(response.data.data);
        setIsOpenProjectsDialogOpen(true);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      toast({
        title: "Error Fetching Projects",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProjectLoading(false);
    }
  };

const handleLoadProject = (project) => {
  // Clear current project state before loading a new one
  dispatch(clearAll());
  dispatch(setActiveProject(project));

  if (project.content) {
    const { nodes, connections, states, constants } = project.content;

    // Load nodes
    if (nodes) {
      dispatch(setGraphNodes(nodes));
    }

    // Load connections
    if (connections) {
      dispatch(setConnections(connections));
    }

    // Load states
    if (states) {
      dispatch(setStates(states));
    }

    // Load multiple constants files
    if (Array.isArray(constants)) {
      dispatch(addConstantFiles(constants));  // Use the new addConstantFiles action
    }
  }

  setIsOpenProjectsDialogOpen(false);
};



  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const userData = await signIn(email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      setUser(userData);
      setIsDialogOpen(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = () => {
    signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  return (
    <>
      <Card className="fixed top-0 left-0 right-0 z-50 rounded-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Project:
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 text-sm font-medium"
                    >
                      {activeProject ? activeProject.name : 'None Selected'}
                    </Badge>
                    {activeProject && (
                      <span className="text-xs text-muted-foreground">
                        {activeProject.description}
                      </span>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-accent"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Actions
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Project Options</DropdownMenuLabel>
                      <DropdownMenuItem
                        className="flex items-center"
                        onSelect={() => setIsProjectDialogOpen(true)}
                      >
                        <FilePlus className="w-4 h-4 mr-2" />
                        Create Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center"
                        onSelect={handleSaveProject}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center"
                        onSelect={handleOpenProjects}
                      >
                        <List className="w-4 h-4 mr-2" />
                        Open Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center"
                        onSelect={() => setIsSettingsDialogOpen(true)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Project Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sign In Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your projects.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEmail('');
                  setPassword('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Sign In</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Creation Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter the details for your new project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My Project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                placeholder="Enter project description..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsProjectDialogOpen(false);
                setProjectName('');
                setProjectDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isProjectLoading || !projectName.trim()}
            >
              {isProjectLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Modify the settings for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name-settings">Project Name</Label>
              <Input
                id="project-name-settings"
                placeholder="My Project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description-settings">Description</Label>
              <Textarea
                id="project-description-settings"
                placeholder="Enter project description..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSettingsDialogOpen(false);
                setProjectName('');
                setProjectDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={isProjectLoading || !projectName.trim()}
            >
              {isProjectLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Projects Dialog */}
      <Dialog open={isOpenProjectsDialogOpen} onOpenChange={setIsOpenProjectsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Open Project</DialogTitle>
            <DialogDescription>
              Select a project to open.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto">
              {allProjects.filter(project => project.name.toLowerCase().includes(searchTerm.toLowerCase())).map(project => (
                <div
                  key={project.id}
                  className="p-2 border-b cursor-pointer hover:bg-accent"
                  onClick={() => handleLoadProject(project)}
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-muted-foreground">{project.description}</div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpenProjectsDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
