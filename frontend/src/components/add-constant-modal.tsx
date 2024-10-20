import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog as DialogComponent, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Delete } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDispatch, useSelector } from 'react-redux';
import { addConstantFile, updateConstantFile } from '@/store/nodeEditorSlice';

interface Constant {
  name: string;
  value: string;
  description: string;
}

interface ConstantFile {
  configName: string;
  fileDescription: string;
  constants: Constant[];
}

interface AddConstantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile: ConstantFile | null;
  isEditing: boolean;
}

export function AddConstantModal({
  isOpen,
  onClose,
  initialFile,
  isEditing,
}: AddConstantModalProps) {
  const dispatch = useDispatch();

  const [constantFile, setConstantFile] = useState<ConstantFile>({
    configName: '',
    fileDescription: '',
    constants: [],
  });

  const [codeValue, setCodeValue] = useState('');
  const [lastUpdatedBy, setLastUpdatedBy] = useState<'fields' | 'code'>('fields');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && initialFile) {
      setConstantFile(initialFile);
      const newCodeValue = generateFileCode(initialFile);
      setCodeValue(newCodeValue);
    } else if (isOpen) {
      setConstantFile({
        configName: '',
        fileDescription: '',
        constants: [],
      });
      setCodeValue('');
    }
    setLastUpdatedBy('fields');
  }, [isOpen, initialFile]);

  // Sync fields with code generation
  useEffect(() => {
    if (lastUpdatedBy === 'fields') {
      const newCodeValue = generateFileCode(constantFile);
      if (newCodeValue !== codeValue) {
        setCodeValue(newCodeValue);
      }
    }
  }, [constantFile, lastUpdatedBy]);

  const handleCodeChange = (newCode: string) => {
    setCodeValue(newCode);
    setLastUpdatedBy('code');
  };

  const handleTabChange = (tab: 'fields' | 'code') => {
    if (tab === 'code') {
      const newCodeValue = generateFileCode(constantFile);
      setCodeValue(newCodeValue);
    } else {
      const parsedFields = parseCodeToFields(codeValue);
      setConstantFile((prev) => ({ ...prev, ...parsedFields }));
    }
    setLastUpdatedBy(tab);
  };

  const handleSave = () => {
    if (!constantFile.configName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a configuration name',
        variant: 'destructive',
      });
      return;
    }

    if (constantFile.constants.some((c) => c.name.trim() === '' || c.value.trim() === '')) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields for constants',
        variant: 'destructive',
      });
      return;
    }

    // Add configName to each constant
    const processedFile = {
      ...constantFile,
      constants: constantFile.constants.map(constant => ({
        ...constant,
        configName: constantFile.configName
      }))
    };

    if (isEditing) {
      dispatch(updateConstantFile(processedFile));
    } else {
      dispatch(addConstantFile(processedFile));
    }
    onClose();
  };

  const addConstant = () => {
    setConstantFile((prev) => ({
      ...prev,
      constants: [...prev.constants, { name: '', value: '', description: '' }],
    }));
  };

  const removeConstant = (index: number) => {
    setConstantFile((prev) => ({
      ...prev,
      constants: prev.constants.filter((_, i) => i !== index),
    }));
  };

  const updateConstant = (index: number, updatedConstant: Partial<Constant>) => {
    setConstantFile((prev) => ({
      ...prev,
      constants: prev.constants.map((constant, i) =>
        i === index ? { ...constant, ...updatedConstant } : constant
      ),
    }));
    setLastUpdatedBy('fields');
  };

  return (
    <DialogComponent open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Constant File' : 'Create New Constant File'}</DialogTitle>
        </DialogHeader>

        <Tabs value={lastUpdatedBy} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="fields">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="config-name">Constant Configuration</label>
                <Input
                  id="config-name"
                  value={constantFile.configName}
                  onChange={(e) => {
                    setConstantFile((prev) => ({ ...prev, configName: e.target.value }));
                    setLastUpdatedBy('fields');
                  }}
                  placeholder="Enter configuration name"
                />
                <p className="text-sm text-muted-foreground">
                  Converted Name: <strong>{convertToPythonFileName(constantFile.configName)}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="file-description">File Description</label>
                <Textarea
                  id="file-description"
                  value={constantFile.fileDescription}
                  onChange={(e) => {
                    setConstantFile((prev) => ({ ...prev, fileDescription: e.target.value }));
                    setLastUpdatedBy('fields');
                  }}
                  placeholder="Describe the purpose of this constant file..."
                />
              </div>

              <div className="space-y-4">
                {constantFile.constants.map((constant, index) => (
                  <div key={index} className="space-y-2 border p-2 rounded">
                    <div className="flex justify-between items-center">
                      <h4>Constant #{index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConstant(index)}
                        className="text-destructive"
                      >
                        <Delete className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor={`constant-name-${index}`}>Constant Name</label>
                      <Input
                        id={`constant-name-${index}`}
                        value={constant.name}
                        onChange={(e) => updateConstant(index, { name: e.target.value })}
                        placeholder="MY_CONSTANT"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor={`constant-value-${index}`}>Constant Value</label>
                      <Input
                        id={`constant-value-${index}`}
                        value={constant.value}
                        onChange={(e) => updateConstant(index, { value: e.target.value })}
                        placeholder="Enter value"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor={`constant-description-${index}`}>Constant Description</label>
                      <Textarea
                        id={`constant-description-${index}`}
                        value={constant.description}
                        onChange={(e) => updateConstant(index, { description: e.target.value })}
                        placeholder="Describe this constant..."
                      />
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addConstant}>
                  <Plus className="w-4 h-4 mr-2" /> Add Constant
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code">
            <Textarea
              value={codeValue}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="font-mono h-[200px] whitespace-pre"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="space-x-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Create File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogComponent>
  );
}

// Helper function to generate the Python code from fields
const generateFileCode = (constantFile: ConstantFile): string => {
  const fileDescription = constantFile.fileDescription ? `# ${constantFile.fileDescription}\n\n` : '';
  const constantsCode = constantFile.constants
    .map((constant) => {
      let constantCode = `${constant.name} = ${constant.value}`;
      if (constant.description) {
        constantCode = `# ${constant.description}\n` + constantCode;
      }
      return constantCode;
    })
    .join('\n\n');
  return fileDescription + constantsCode;
};

// Helper function to parse the code into fields
const parseCodeToFields = (code: string): Partial<ConstantFile> => {
  const lines = code.split('\n');
  const constants: Constant[] = [];
  let fileDescription = '';
  let currentConstant: Partial<Constant> = {};

  lines.forEach((line) => {
    if (line.startsWith('#')) {
      const comment = line.replace('#', '').trim();
      if (!currentConstant.name) {
        fileDescription = comment;
      } else {
        currentConstant.description = comment;
      }
    } else if (line.includes('=')) {
      const [name, value] = line.split('=').map((part) => part.trim());
      currentConstant.name = name;
      currentConstant.value = value;
      constants.push(currentConstant as Constant);
      currentConstant = {};
    }
  });

  return {
    fileDescription,
    constants,
  };
};

// Helper to convert to valid Python file name
const convertToPythonFileName = (name: string): string => {
  let convertedName = name.trim().toLowerCase().replace(/\s+/g, '_');
  convertedName = convertedName.replace(/[^a-z0-9_]/g, '');
  if (/^[0-9]/.test(convertedName)) {
    convertedName = `file_${convertedName}`;
  }
  return convertedName;
};