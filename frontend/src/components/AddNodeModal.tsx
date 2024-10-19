'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { X, Plus, Code } from 'lucide-react'
import axios from 'axios'

type AddNodeModalProps = {
    isOpen: boolean
    onClose: () => void
    onAddNode: (nodeName: string, nodeCode: string) => void
}

export function AddNodeModal({ isOpen, onClose, onAddNode }: AddNodeModalProps) {
    const [nodeName, setNodeName] = useState('')
    const [nodeCode, setNodeCode] = useState('')
    const [parsedJson, setParsedJson] = useState(null)  // State to store the parsed JSON data

    const handleAddNode = async () => {
        console.log("Node Name:", nodeName);
        console.log("Node Code:", nodeCode);

        if (!nodeName || !nodeCode) {
            console.error("Node name or code is missing!");
            return;
        }

        onAddNode(nodeName, nodeCode);

        // First, parse the node code and get the response directly
        const response = await sendCodeToBackend(nodeName, nodeCode);

        // If parsing was successful, add the node to the database
        if (response && response.configurations) {
            console.log('Trying to add Node to the database...');
            await addNodeToDatabase(nodeName, nodeCode, response.configurations);
        } else {
            console.log('No parsedJson');
        }

        // Reset inputs after adding the node
        setNodeName('');
        setNodeCode('');
    };

    // Update sendCodeToBackend to return the parsed response directly
    const sendCodeToBackend = async (nodeName: string, nodeCode: string) => {
        const source = axios.CancelToken.source();
        try {
            const response = await axios.post('http://127.0.0.1:8001/api/parse-code/', {
                node_name: nodeName,
                node_code: nodeCode,
            }, { cancelToken: source.token });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            console.log('Response data:', response.data);

            // Return the response data directly instead of relying on state
            return response.data;
        } catch (error) {
            if (axios.isCancel(error)) {
                console.error('Request canceled', error.message);
            } else {
                if (error.response) {
                    console.error('Error response status:', error.response.status);
                    console.error('Error response headers:', error.response.headers);
                    console.error('Error response data:', error.response.data);
                } else if (error.request) {
                    console.error('No response received:', error.request);
                } else {
                    console.error('Error message:', error.message);
                }
            }
            return null;
        } finally {
            source.cancel("Component unmounted or request canceled");
        }
    };

    // Function to add the parsed node to the database
    const addNodeToDatabase = async (nodeName: string, nodeCode: string, configurations: any, ownerId: string) => {
        try {
            // Example UUID for owner_id
            const ownerId = "123e4567-e89b-12d3-a456-426614174000";  // Sample owner ID (UUID)

            // Log the data being sent to the backend for debugging
            console.log("Sending data to the database:", {
                node_name: nodeName,
                full_code: nodeCode,
                configurations: configurations,
                owner_id: ownerId, // Make sure owner_id is included
                is_public: true  // Ensure this is sent if needed
            });

            // Make the API request
            const response = await axios.post('http://127.0.0.1:8000/api/nodes/', {
                node_name: nodeName,
                full_code: nodeCode,
                configurations: configurations,
                owner_id: ownerId, // Include owner_id here
                is_public: true  // If required
            });

            // Log the full response
            console.log('Full response:', response);

            // Handle the response data
            const responseData = response.data;
            console.log('Node added to the database:', responseData);

            if (responseData) {
                console.log('Node added to the database:', responseData);
            } else {
                console.log('Unexpected response format. Received null data.');
            }

        } catch (error) {
            // If there's an error, log it with the full Axios error object
            console.error('Error adding node to the database:', error);

            if (error.response) {
                // Log the response status, data, and headers for debugging
                console.log('Error Response Status:', error.response.status);
                console.log('Error Response Data:', error.response.data);
                console.log('Error Response Headers:', error.response.headers);
            } else if (error.request) {
                // Log if the request was made but no response was received
                console.log('No response received:', error.request);
            } else {
                // Other errors (setup issues, etc.)
                console.log('Error setting up the request:', error.message);
            }

            console.log('Error stack:', error.stack);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => open ? null : onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-lg font-semibold">
                        <Plus className="mr-2 h-5 w-5" />
                        Add New Node
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="nodeName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                        <label htmlFor="nodeCode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                {parsedJson && (  // Display the parsed JSON information without the full code
                    <div className="bg-gray-100 p-4 rounded mt-4">
                        <h3 className="font-semibold">Node Info</h3>
                        <p><strong>Node Name:</strong> {parsedJson.node_name}</p>
                        <h4 className="mt-4">Configurations:</h4>
                        <ul className="list-disc pl-4">
                            {parsedJson.configurations && Object.keys(parsedJson.configurations).map((key) => (
                                <li key={key}>
                                    <strong>{key}</strong>: {parsedJson.configurations[key].value} <em>({parsedJson.configurations[key].description})</em>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
