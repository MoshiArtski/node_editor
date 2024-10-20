'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Plus, Code } from 'lucide-react';
import axios from 'axios';
import useNodeEditorStore from '@/store/nodeEditorStore';

type AddNodeModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function AddNodeModal({ isOpen, onClose }: AddNodeModalProps) {
    const [nodeName, setNodeName] = useState('');
    const [nodeCode, setNodeCode] = useState('');

    const addNode = useNodeEditorStore((state) => state.addNode); // Zustand action to add a node

    const handleAddNode = async () => {
        if (!nodeName || !nodeCode) {
            console.error("Node name or code is missing!");
            return;
        }

        // Send the node data to the backend for parsing
        const response = await sendCodeToBackend(nodeName, nodeCode);

        if (response && response.configurations) {
            // Add the node to Zustand store
            addNode({ nodeName, nodeCode, configurations: response.configurations });
            console.log('Node added to the store');
        } else {
            console.log('Failed to parse or no configurations');
        }

        // Reset the input fields
        setNodeName('');
        setNodeCode('');
        onClose(); // Close the modal after adding the node
    };

    const sendCodeToBackend = async (nodeName: string, nodeCode: string) => {
        try {
            const response = await axios.post('http://127.0.0.1:8001/api/parse-code/', {
                node_name: nodeName,
                node_code: nodeCode,
            });
            return response.data;
        } catch (error) {
            console.error('Error sending code to backend:', error);
            return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-lg font-semibold">
                        <Plus className="mr-2 h-5 w-5" />
                        Add New Node
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="nodeName" className="text-sm font-medium leading-none">
                            Node Name
                        </label>
                        <Input
                            id="nodeName"
                            placeholder="Enter node name"
                            value={nodeName}
                            onChange={(e) => setNodeName(e.target.value)}
                            maxLength={50}
                        />
                        <p className="text-sm text-muted-foreground text-right">
                            {nodeName.length}/50
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="nodeCode" className="text-sm font-medium leading-none">
                            Node Code
                        </label>
                        <div className="relative">
                            <Textarea
                                id="nodeCode"
                                placeholder="Paste node code here"
                                value={nodeCode}
                                onChange={(e) => setNodeCode(e.target.value)}
                                className="min-h-[200px] font-mono text-sm pl-8"
                            />
                            <Code className="absolute left-2 top-2 h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAddNode} disabled={!nodeName || !nodeCode}>
                        Add Node
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
