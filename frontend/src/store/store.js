import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import nodeEditorReducer from './nodeEditorSlice'; // Ensure this is correct

// Configure the store
export const makeStore = () =>
  configureStore({
    reducer: {
      nodeEditor: nodeEditorReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });

// Create a wrapper for Next.js
export const wrapper = createWrapper(makeStore);
export const store = makeStore(); // Export the store directly
