import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import nodeEditorReducer from './nodeEditorSlice'; // Correct import for nodeEditorSlice
import projectReducer from './projectSlice'; // Import the project slice for managing active projects

// Configure the store
export const makeStore = () =>
  configureStore({
    reducer: {
      nodeEditor: nodeEditorReducer, // Existing node editor slice
      project: projectReducer,       // New project slice for managing active project
    },
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development mode
  });

// Create a wrapper for Next.js
export const wrapper = createWrapper(makeStore);

// Export the store directly
export const store = makeStore();
