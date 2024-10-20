import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useSelector, useDispatch } from 'react-redux';
import { selectConstants, selectStates, updateConstant } from '@/store/nodeEditorSlice';
import clsx from 'clsx';

const NodeConfigurationSidebar: React.FC<NodeConfigurationSidebarProps> = ({
  selectedNode,
  isOpen,
  onClose,
  onConfigChange,
  onSave,
}) => {
  const constants = useSelector(selectConstants);
  const states = useSelector(selectStates);
  const dispatch = useDispatch();

  // Enhanced config state type to include state properties
  const [configStates, setConfigStates] = useState<Record<string, {
    type: 'constant' | 'state' | 'custom',
    value: string,
    stateName?: string,
    propertyName?: string
  }>>({});

  // Process state fields into a flat list of properties
  const stateProperties = React.useMemo(() => {
    return states.flatMap(state =>
      state.fields.map(field => ({
        stateName: state.name,
        propertyName: field.name,
        type: field.type === 'custom' ? field.customType : field.type,
        value: `${state.name}.${field.name}`,
        description: field.comment
      }))
    );
  }, [states]);

  useEffect(() => {
    if (selectedNode && selectedNode.data.configurations) {
      const initialConfigStates: Record<string, {
        type: 'constant' | 'state' | 'custom',
        value: string,
        stateName?: string,
        propertyName?: string
      }> = {};

      Object.entries(selectedNode.data.configurations.class_attributes).forEach(([key, config]) => {
        // Check if the value matches a constant
        const matchedConstant = constants.find(constant => constant.value === config.value);
        if (matchedConstant) {
          initialConfigStates[key] = {
            type: 'constant',
            value: matchedConstant.value
          };
          return;
        }

        // Check if the value matches a state property
        const matchedProperty = stateProperties.find(prop => prop.value === config.value);
        if (matchedProperty) {
          initialConfigStates[key] = {
            type: 'state',
            value: matchedProperty.value,
            stateName: matchedProperty.stateName,
            propertyName: matchedProperty.propertyName
          };
          return;
        }

        // Default to custom if no matches
        initialConfigStates[key] = {
          type: 'custom',
          value: config.value
        };
      });

      setConfigStates(initialConfigStates);
    }
  }, [selectedNode, constants, stateProperties]);

  const handleConfigChange = useCallback(
    (key: string, newValue: string) => {
      if (selectedNode) {
        onConfigChange(selectedNode.id, key, 'value', newValue);
        setConfigStates((prev) => ({
          ...prev,
          [key]: { ...prev[key], value: newValue }
        }));
      }
    },
    [onConfigChange, selectedNode]
  );

  const handleDropdownChange = useCallback(
    (key: string, selectedValue: string) => {
      if (selectedValue === "custom") {
        setConfigStates((prev) => ({
          ...prev,
          [key]: { type: 'custom', value: '' }
        }));
        return;
      }

      // Check if the selected value is a constant
      const matchedConstant = constants.find(constant => constant.value === selectedValue);
      if (matchedConstant) {
        setConfigStates((prev) => ({
          ...prev,
          [key]: { type: 'constant', value: selectedValue }
        }));
        handleConfigChange(key, selectedValue);
        return;
      }

      // Check if the selected value is a state property
      const matchedProperty = stateProperties.find(prop => prop.value === selectedValue);
      if (matchedProperty) {
        setConfigStates((prev) => ({
          ...prev,
          [key]: {
            type: 'state',
            value: selectedValue,
            stateName: matchedProperty.stateName,
            propertyName: matchedProperty.propertyName
          }
        }));
        handleConfigChange(key, selectedValue);
        return;
      }
    },
    [constants, stateProperties, handleConfigChange]
  );

  const handleConstantUpdate = useCallback(
    (key: string, newValue: string) => {
      const matchedConstant = constants.find(constant => constant.value === configStates[key].value);
      if (matchedConstant) {
        dispatch(updateConstant({
          ...matchedConstant,
          value: newValue,
        }));
      }
    },
    [dispatch, constants, configStates]
  );

  return (
    <TooltipProvider>
      <div
        className={clsx(
          "fixed top-0 right-0 h-full transition-transform transform z-50",
          {
            "translate-x-0": isOpen,
            "translate-x-full": !isOpen,
          }
        )}
        style={{ width: '20rem', boxShadow: '0 0 10px rgba(0,0,0,0.3)', backgroundColor: 'white' }}
      >
        <div className="p-4 w-full">
          {selectedNode && selectedNode.data.configurations && selectedNode.data.configurations.class_attributes ? (
            <>
              <h3 className="text-lg font-bold mb-4">
                {selectedNode.data.label} Configurations
              </h3>

              {Object.entries(selectedNode.data.configurations.class_attributes).map(([key, config]) => (
                <div key={key} className="mb-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key}
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      {config.description}
                    </TooltipContent>
                  </Tooltip>

                  <select
                    value={configStates[key]?.value || ''}
                    onChange={(e) => handleDropdownChange(key, e.target.value)}
                    className="mb-2 block w-full p-2 border rounded"
                  >
                    <option value="">Select a Value</option>

                    {/* Constants Group */}
{constants.length > 0 && (
  <optgroup label="Constants">
    {constants.map((constant) => (
      <option key={constant.name} value={constant.value}>
        {constant.name} ({constant.configName}) {/* Include configName here */}
      </option>
    ))}
  </optgroup>
)}


                    {/* State Properties Group */}
                    {states.length > 0 && (
                      <optgroup label="State Properties">
                        {stateProperties.map((prop) => (
                          <option key={prop.value} value={prop.value}>
                            {prop.value} ({prop.type})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <option value="custom">Custom Value</option>
                  </select>

                  {/* Custom value input field */}
                  {configStates[key]?.type === 'custom' && (
                    <Input
                      value={configStates[key]?.value || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        handleConfigChange(key, newValue);
                        handleConstantUpdate(key, newValue);
                      }}
                      className="mt-2 block w-full"
                      placeholder="Enter custom value"
                    />
                  )}
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-gray-500">No configurations available</p>
          )}
          <Button onClick={onSave} className="w-full mt-4 mb-2">
            Save Changes
          </Button>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default NodeConfigurationSidebar;