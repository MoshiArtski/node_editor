"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Use your useAuth hook for authentication
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePlus, LogOut, User, Loader2, ChevronDown, FolderOpen, Save, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import axios from 'axios';

export function MenuBarComponent() {
  const { user, signIn, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [projectName, setProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false); // For confirmation dialog
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false); // Separate state for project dialog
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Base API URLs
  const API_PROJECT_MANAGER_URL = process.env.NEXT_PUBLIC_API_PROJECT_MANAGER_URL || 'http://127.0.0.1:8004/projects';
  const API_GENERATION_URL = process.env.NEXT_PUBLIC_API_GENERATION_URL || 'http://127.0.0.1:8002'; // Ensure this matches your routes

  // Handle project creation
  const handleCreateProject = async () => {
    setIsProjectLoading(true);
    try {
      const response = await axios.post(`${API_PROJECT_MANAGER_URL}/create`, {
        user_id: user.id,
        name: projectName,
        description: "", // Optional: Add a description if needed
      });

      toast({
        title: "Project Created",
        description: `Project "${projectName}" has been created.`,
      });
      setProjectName('');
    } catch (error) {
      toast({
        title: "Error Creating Project",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Handle project saving (updating)
  const handleSaveProject = async () => {
    if (!selectedProject) {
      toast({
        title: "No Project Selected",
        description: "Please select or create a project first.",
        variant: "destructive",
      });
      return;
    }
    setIsProjectLoading(true);
    try {
      const response = await axios.put(`${API_PROJECT_MANAGER_URL}/update/${selectedProject.id}`, {
        content: { /* your project content */ },
      });

      toast({
        title: "Project Saved",
        description: `Project "${selectedProject.name}" has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Error Saving Project",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Handle project opening (getting)
  const handleOpenProject = async (projectId) => {
    setIsProjectLoading(true);
    try {
      const response = await axios.get(`${API_PROJECT_MANAGER_URL}/get/${projectId}`);
      setSelectedProject(response.data.data);

      toast({
        title: "Project Opened",
        description: `Project "${response.data.data.name}" has been opened.`,
      });
    } catch (error) {
      toast({
        title: "Error Opening Project",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!selectedProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project to delete.",
        variant: "destructive",
      });
      return;
    }
    setIsProjectLoading(true);
    try {
      const response = await axios.delete(`${API_PROJECT_MANAGER_URL}/delete/${selectedProject.id}`);

      setSelectedProject(null);
      toast({
        title: "Project Deleted",
        description: `Project "${selectedProject.name}" has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error Deleting Project",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Handle project generation with confirmation modal
  const handleGenerateProject = async () => {
    setIsConfirmationDialogOpen(true);
  };

  // Handle confirmation of project generation
  const confirmGenerateProject = async () => {
    setIsProjectLoading(true);
    setIsConfirmationDialogOpen(false); // Close the confirmation dialog
    try {
      const response = await axios.post(`${API_GENERATION_URL}/api/generate_project`, {
        project_name: projectName,
      });

      toast({
        title: "Project Generated",
        description: `Project "${projectName}" has been generated.`,
      });
      setProjectName('');
    } catch (error) {
      toast({
        title: "Error Generating Project",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Authentication handlers (signIn, signOut)
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      setIsDialogOpen(false); // Close the sign-in modal when signed in successfully
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
            <div className="flex items-center space-x-2">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-accent">
                      <FolderOpen className="w-4 h-4" />
                      Projects
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Project Options</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={handleCreateProject}>
                      <FilePlus className="w-4 h-4 mr-2" />
                      Create Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsProjectDialogOpen(true)}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Open Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleSaveProject}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleDeleteProject}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleGenerateProject}>
                      <FilePlus className="w-4 h-4 mr-2" />
                      Generate Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Confirmation Dialog for Project Generation */}
      <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
        <DialogContent className="max-w-lg mx-auto p-6 bg-white rounded-md shadow-lg border border-gray-200">
          <DialogHeader className="space-y-2 text-center">
            <DialogTitle className="text-xl font-semibold text-primary">
              Confirm Project Generation
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to generate the project "<span className="font-medium">{projectName}</span>"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4 space-x-4">
            <Button onClick={() => setIsConfirmationDialogOpen(false)} variant="ghost" className="w-1/3 py-2 rounded-md border border-gray-300 hover:bg-gray-100">
              Cancel
            </Button>
            <Button onClick={confirmGenerateProject} disabled={isProjectLoading} className="w-1/3 py-2 rounded-md bg-accent text-white hover:bg-accent-dark">
              {isProjectLoading ? 'Generating...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for setting project name */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open or Create New Project</DialogTitle>
            <DialogDescription>
              Enter the name for your new project or open an existing one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="My Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsProjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={isProjectLoading}>
              {isProjectLoading ? 'Generating...' : 'Generate Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign-in Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome</DialogTitle>
            <DialogDescription>
              Sign in to your account or create a new one
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
