'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog as DialogComponent, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Delete, AlertCircle, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";


// Types
interface StateField {
  name: string;
  type: string;
  comment: string;
  customType?: string;
}

interface CustomState {
  name: string;
  description: string;
  fields: StateField[];
  imports?: string[];
  customFunctions?: string;
}

// Default initial state
const DEFAULT_STATE: CustomState = {
  name: '',
  description: '',
  fields: [],
  imports: [],
  customFunctions: ''
};

// Component props
interface StateCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialState: CustomState | null;
  onSave: (state: CustomState) => void;
  isEditing?: boolean;
}

// Constants
const TYPE_OPTIONS = [
  { value: 'str', label: 'String', description: 'Text data' },
  { value: 'int', label: 'Integer', description: 'Whole numbers' },
  { value: 'float', label: 'Float', description: 'Decimal numbers' },
  { value: 'bool', label: 'Boolean', description: 'True/False values' },
  { value: 'List[str]', label: 'List of Strings', description: 'Array of text values' },
  { value: 'List[int]', label: 'List of Integers', description: 'Array of whole numbers' },
  { value: 'List[float]', label: 'List of Floats', description: 'Array of decimal numbers' },
  { value: 'Dict', label: 'Dictionary', description: 'Key-value pairs' },
  { value: 'datetime', label: 'DateTime', description: 'Date and time values' },
  { value: 'Optional[str]', label: 'Optional String', description: 'Optional text data' },
  { value: 'Optional[int]', label: 'Optional Integer', description: 'Optional whole numbers' },
  { value: 'Set[str]', label: 'Set of Strings', description: 'Unique text values' },
  { value: 'Tuple[str, int]', label: 'Tuple (String, Integer)', description: 'Fixed pair of values' },
  { value: 'Any', label: 'Any Type', description: 'Any data type' },
  { value: 'Annotated[List[str], operator.add]', label: 'Annotated List', description: 'List with metadata' },
  { value: 'custom', label: 'Custom Type...', description: 'Define your own type' }
] as const;

// Type definitions for clarity
type BasicType = 'str' | 'int' | 'float' | 'bool' | 'datetime' | 'Any';
type ComplexType = `List[${BasicType}]` | `Optional[${BasicType}]` | `Set[${BasicType}]` | `Dict` | `Tuple[${string}]` | `Annotated[${string}]`;
type FieldType = BasicType | ComplexType | 'custom';

interface TypeImport {
  module: string;
  items: Set<string>;
}

// Helper functions for code generation
const formatImports = (imports: TypeImport[]): string => {
  return imports
    .map(imp => `from ${imp.module} import ${Array.from(imp.items).sort().join(', ')}`)
    .join('\n');
};

const formatDocstring = (description: string, fields: StateField[]): string => {
  const lines = ['    """'];

  // Add main description
  if (description) {
    lines.push(`    ${description}`);
    lines.push('');
  }

  // Add attributes section
  lines.push('    Attributes:');
  fields.forEach(field => {
    const fieldDoc = field.comment.trim();
    const formattedType = field.type === 'custom' ? field.customType : field.type;
    lines.push(`        ${field.name} (${formattedType}): ${fieldDoc}`);
  });

  lines.push('    """');
  return lines.join('\n');
};

const validateFieldName = (name: string): boolean => {
  const isValid = /^[a-z_][a-z0-9_]*$/i.test(name) && name.trim() !== '';
  console.log(`Validating field name: "${name}", isValid: ${isValid}`);
  return isValid;
};

const parseTypeCode = (code: string): Partial<CustomState> => {
  const result: Partial<CustomState> = {
    name: '',
    description: '',
    fields: [],
    imports: [],
    customFunctions: ''
  };

  try {
    const lines = code.trim().split('\n');
    let inClass = false;
    let inDocstring = false;
    let docstringLines: string[] = [];
    let customFunctionsStart = -1;

    // Regex patterns
    const classPattern = /^class\s+(\w+)\s*\(\s*TypedDict\s*\)\s*:/;
    const fieldPattern = /^\s*(\w+)\s*:\s*([^#]+)(?:#\s*(.*))?$/;
    const docstringPattern = /^\s*"""/;

    // Find class definition line
    const classLineIndex = lines.findIndex(line => classPattern.test(line));

    if (classLineIndex === -1) {
      throw new Error('No TypedDict class found');
    }

    // Everything before the class (except the first TypedDict import) is considered imports
    const imports = lines.slice(0, classLineIndex)
      .filter(line => line.trim())
      .filter(line => !line.includes('TypedDict'));

    result.imports = imports;

    // Extract class name
    const classMatch = lines[classLineIndex].match(classPattern);
    if (classMatch) {
      result.name = classMatch[1];
    }

    // Process remaining lines after class definition
    for (let i = classLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) continue;

      // Handle docstring
      if (trimmedLine.match(docstringPattern)) {
        if (!inDocstring) {
          inDocstring = true;
          continue;
        } else {
          const processedDoc = processDocstring(docstringLines);
          result.description = processedDoc.description;
          if (processedDoc.fields.length > 0) {
            result.fields = processedDoc.fields;
          }
          inDocstring = false;
          continue;
        }
      }

      if (inDocstring) {
        docstringLines.push(line);
        continue;
      }

      // Handle fields
      const fieldMatch = line.match(fieldPattern);
      if (fieldMatch) {
        const [, name, typeStr, comment] = fieldMatch;
        const type = typeStr.trim();
        const isCustomType = !TYPE_OPTIONS.map(t => t.value).includes(type);

        const field: StateField = {
          name: name,
          type: isCustomType ? 'custom' : type,
          comment: comment?.trim() || '',
          customType: isCustomType ? type : undefined
        };

        result.fields.push(field);
      } else if (trimmedLine && !trimmedLine.startsWith('#')) {
        // If we've hit a non-field line that's not a comment, assume it's custom functions
        customFunctionsStart = i;
        break;
      }
    }

    // Collect custom functions
    if (customFunctionsStart !== -1) {
      result.customFunctions = lines.slice(customFunctionsStart).join('\n');
    }

    return result;
  } catch (error) {
    console.error('Error parsing type code:', error);
    throw new Error('Failed to parse type code');
  }
};

// Also update the generateTypeCode function to ensure imports are properly formatted
const generateTypeCode = (state: CustomState): string => {
  // Start with the TypedDict import
  const codeLines: string[] = [
    'from typing import TypedDict'
  ];

  // Add custom imports if they exist
  if (Array.isArray(state.imports) && state.imports.length > 0) {
    codeLines.push(...state.imports.filter(imp => imp.trim() !== ''));
  }

  // Add an empty line before the class definition
  codeLines.push('');

  // Add class definition
  codeLines.push(
    `class ${state.name}(TypedDict):`,
    formatDocstring(state.description, state.fields),
    ''
  );

  // Add fields
  state.fields.forEach(field => {
    if (!validateFieldName(field.name)) {
      throw new Error(`Invalid field name: "${field.name || '<empty>'}"`);
    }

    const fieldType = field.type === 'custom' ? field.customType : field.type;
    let line = `    ${field.name}: ${fieldType}`;

    // Add inline comment if it provides additional information
    const comment = field.comment.trim();
    if (comment && !comment.includes(fieldType)) {
      line += `  # ${comment}`;
    }

    codeLines.push(line);
  });

  // Add custom functions
  if (state.customFunctions) {
    codeLines.push('', state.customFunctions);
  }

  return codeLines.join('\n');
};

// Helper function to process docstring content
const processDocstring = (lines: string[]): { description: string; fields: StateField[] } => {
  const result = {
    description: '',
    fields: [] as StateField[]
  };

  let inAttributes = false;
  let descriptionLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === 'Attributes:') {
      inAttributes = true;
      continue;
    }

    if (!inAttributes) {
      if (trimmedLine) {
        descriptionLines.push(trimmedLine);
      }
    } else {
      // Parse field documentation
      const fieldMatch = trimmedLine.match(/^\s*(\w+)\s*\(([^)]+)\):\s*(.*)$/);
      if (fieldMatch) {
        const [, name, type, comment] = fieldMatch;
        const isCustomType = !TYPE_OPTIONS.map(t => t.value).includes(type);

        result.fields.push({
          name,
          type: isCustomType ? 'custom' : type,
          comment: comment.trim(),
          customType: isCustomType ? type : undefined
        });
      }
    }
  }

  result.description = descriptionLines.join(' ').trim();
  return result;
};

// Field Card Component
const FieldCard: React.FC<FieldCardProps> = React.memo(({ field, index, onUpdate, onRemove, isLast }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleCopyField = useCallback(() => {
    const fieldData = {
      name: field.name,
      type: field.type,
      comment: field.comment,
      customType: field.customType
    };
    navigator.clipboard.writeText(JSON.stringify(fieldData, null, 2));
    setCopyStatus('copied');
    Toast({
      title: "Field copied",
      description: "Field configuration has been copied to clipboard",
    });
    setTimeout(() => setCopyStatus('idle'), 2000);
  }, [field]);

  const selectedType = TYPE_OPTIONS.find(t => t.value === field.type);

  return (
    <Card className="relative group">
      <CardContent className="p-6">
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopyField}
                >
                  {copyStatus === 'copied' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy field configuration</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemove(index)}
                >
                  <Delete className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove field</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Field Content */}
        <div className="space-y-6">
          {/* Name and Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Field Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Field Name
                {!field.name && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </Label>
              <Input
                value={field.name}
                onChange={e => onUpdate(index, { name: e.target.value })}
                placeholder="field_name"
                className={`h-10 ${!field.name ? 'border-destructive' : ''}`}
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-0">
              <Label>Type</Label>
              <div className="flex items-start gap-0">
                <Select
                  value={field.type}
                  onValueChange={(value) => onUpdate(index, { type: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.type === 'custom' && (
                  <Input
                    value={field.customType || ''}
                    onChange={(e) => onUpdate(index, { customType: e.target.value })}
                    placeholder="Custom type"
                    className="h-10"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Comment Field */}
          <div className="space-y-2">
            <Label>Comment</Label>
            <Textarea
              value={field.comment}
              onChange={e => onUpdate(index, { comment: e.target.value })}
              placeholder="Describe this field..."
              className="resize-none"
            />
          </div>

          {/* Type Description Badge */}
          {selectedType && (
            <Badge variant="secondary" className="mt-2">
              {selectedType.description}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

FieldCard.displayName = 'FieldCard';

// Main Modal Component
export function StateCreationModalComponent({
  isOpen,
  onClose,
  initialState,
  onSave,
  isEditing = false
}: StateCreationModalProps) {
  const [state, setState] = useState<CustomState>(() =>
    initialState || DEFAULT_STATE
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');
  const [codeValue, setCodeValue] = useState('');
  const [lastUpdatedBy, setLastUpdatedBy] = useState<'fields' | 'code'>('fields');

  // Reset state when modal opens
useEffect(() => {
  if (isOpen) {
    // Check if it's editing mode and there's an initial state
    if (initialState && isEditing) {
      // If editing, populate the modal with the existing data
      setState(initialState);
    } else {
      // If not editing, reset to default state
      setState(DEFAULT_STATE);
    }
    // Generate the code based on the current or default state
    const generatedCode = generateTypeCode(initialState || DEFAULT_STATE);
    setCodeValue(generatedCode);
    setHasChanges(false);
    setLastUpdatedBy('fields');
    setActiveTab('fields');
  } else {
    // When closing the modal, reset everything to default
    setState(DEFAULT_STATE);
    setHasChanges(false);
    setActiveTab('fields');
    setLastUpdatedBy('fields');
    setCodeValue(generateTypeCode(DEFAULT_STATE));
  }
}, [isOpen, initialState, isEditing]);


  // Handle tab changes
const handleTabChange = (newTab: string) => {
  if (newTab === 'code' && lastUpdatedBy === 'fields') {
    const generatedCode = generateTypeCode(state);
    if (generatedCode !== codeValue) {
      setCodeValue(generatedCode);
    }
  } else if (newTab === 'fields' && lastUpdatedBy === 'code') {
    try {
      const parsedState = parseTypeCode(codeValue);
      setState(prev => ({
        ...prev,
        ...parsedState // Use all parsed state directly
      }));
    } catch (error) {
      console.error('Error parsing code:', error);
      Toast({
        title: "Error",
        description: "Failed to parse code. Please check your syntax.",
        variant: "destructive",
      });
    }
  }
  setActiveTab(newTab);
};

const handleCodeChange = useCallback((newCode: string) => {
  setCodeValue(newCode);
  setHasChanges(true);
  setLastUpdatedBy('code');
  try {
    const parsedState = parseTypeCode(newCode);
    setState(prev => ({
      ...prev,
      ...parsedState // Use all parsed state directly
    }));
  } catch (error) {
    console.error('Error updating state from code:', error);
    Toast({
      title: "Error",
      description: "Failed to parse code. Please check your syntax.",
      variant: "destructive",
    });
  }
}, []);


  const handleImportsChange = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      imports: value.split('\n').filter(line => line.length > 0)
    }));
    setHasChanges(true);
    setLastUpdatedBy('fields');
  }, []);

const handleCustomFunctionsChange = useCallback((value: string) => {
  setState(prev => ({
    ...prev,
    customFunctions: value,
  }));
  setHasChanges(true);
  setLastUpdatedBy('fields');
  setCodeValue(generateTypeCode({ ...state, customFunctions: value }));
}, [state]);


  const addStateField = useCallback(() => {
    const updatedFields = [...state.fields, { name: '', type: 'str', comment: '' }];
    setState(prev => ({
      ...prev,
      fields: updatedFields
    }));
    setHasChanges(true);
    setCodeValue(generateTypeCode({ ...state, fields: updatedFields }));
  }, [state]);

  const removeStateField = useCallback((index: number) => {
    const updatedFields = state.fields.filter((_, i) => i !== index);
    setState(prev => ({
      ...prev,
      fields: updatedFields
    }));
    setHasChanges(true);
    setCodeValue(generateTypeCode({ ...state, fields: updatedFields }));
  }, [state]);

const updateStateField = useCallback((index: number, field: Partial<StateField>) => {
  const updatedFields = state.fields.map((f, i) => (i === index ? { ...f, ...field } : f));

  if (field.name && !validateFieldName(field.name)) {
    Toast({
      title: "Invalid Field Name",
      description: "Field names must be valid Python identifiers.",
      variant: "destructive",
    });
    return;
  }

  setState(prev => ({
    ...prev,
    fields: updatedFields,
  }));
  setHasChanges(true);
  setCodeValue(generateTypeCode({ ...state, fields: updatedFields }));
}, [state]);


  const handleCustomTypeChange = useCallback((index: number, value: string) => {
    updateStateField(index, { customType: value, type: 'custom' });
  }, [updateStateField]);

const isValid = useMemo(() => {
  const nameValid = state.name.trim() !== '';
  const fieldsValid = state.fields.every(field => validateFieldName(field.name));
  const hasFields = state.fields.length > 0;
  return nameValid && fieldsValid && hasFields;
}, [state]);

const handleSave = useCallback(() => {
  if (!isValid) {
    Toast({
      title: "Validation Error",
      description: "Please fill in all required fields.",
      variant: "destructive",
    });
    return;
  }

  // Ensure that the updated state name is included in the saved data
  onSave({
    ...state,
    name: state.name.trim(),  // Ensure the name is updated
  });
  onClose();
}, [state, isValid, onSave, onClose]);

 return (
    <DialogComponent open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit State' : 'Create New State'}
            {hasChanges && <Badge className="ml-2">Modified</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="functions">Custom Functions</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="h-[60vh] overflow-y-auto">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {!isValid && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4"/>
                      <AlertDescription>
                        Please fill in all required fields and ensure at least one field is defined.
                      </AlertDescription>
                    </Alert>
                )}


                <div className="grid gap-2">
                  <Label htmlFor="state-name" className="flex items-center gap-2">
                    State Name
                    {!state.name && <AlertCircle className="w-4 h-4 text-destructive"/>}
                  </Label>
                  <Input
                      id="state-name"
                      value={state.name}
                      onChange={e => {
                        setState(prev => ({...prev, name: e.target.value}));
                        setHasChanges(true);
                        setLastUpdatedBy('fields');
                      }}
                      placeholder="MyCustomState"
                      className={!state.name ? 'border-destructive' : ''}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="state-description">Description</Label>
                  <Textarea
                      id="state-description"
                      value={state.description}
                      onChange={e => {
                        setState(prev => ({...prev, description: e.target.value}));
                        setHasChanges(true);
                        setLastUpdatedBy('fields');
                      }}
                      placeholder="Describe the purpose of this state..."
                      rows={5}
                      className="resize-none"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="additional-imports">Additional Imports</Label>
                  <Textarea
                      id="additional-imports"
                      value={Array.isArray(state.imports) ? state.imports.join('\n') : ''}
                      onChange={e => handleImportsChange(e.target.value)}
                      placeholder="from datetime import datetime"
                      rows={5}
                      className="resize-none font-mono"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Fields</Label>
                    <Button variant="outline" size="sm" onClick={addStateField}>
                      <Plus className="w-4 h-4 mr-2"/> Add Field
                    </Button>
                  </div>

                  {state.fields.map((field, index) => (
                      <FieldCard
                          key={index}
                          field={field}
                          index={index}
                          onUpdate={updateStateField}
                          onRemove={removeStateField}
                          isLast={index === state.fields.length - 1}
                      />
                  ))}

                  {state.fields.length === 0 && (
                      <Alert>
                        <AlertDescription>
                          No fields defined yet. Click "Add Field" to start building your state.
                        </AlertDescription>
                      </Alert>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="functions" className="h-[60vh]">
            <Textarea
                value={state.customFunctions}
                onChange={e => handleCustomFunctionsChange(e.target.value)}
                placeholder="def my_custom_function():\n    # Your function here"
                rows={10}
                className="resize-none font-mono"
            />
          </TabsContent>

          <TabsContent value="code" className="h-[60vh]">
            <Textarea
                value={codeValue}
                onChange={e => handleCodeChange(e.target.value)}
                className="font-mono h-[calc(60vh-4rem)] whitespace-pre"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
              onClick={handleSave}
              disabled={!isValid}
          >
            {isEditing ? 'Save Changes' : 'Create State'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogComponent>
  );
}
