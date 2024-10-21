import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeProject: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setActiveProject: (state, action) => {
      state.activeProject = action.payload;
    },
    clearActiveProject: (state) => {
      state.activeProject = null;
    },
  },
});

export const { setActiveProject, clearActiveProject } = projectSlice.actions;

// Selectors
export const selectActiveProject = (state) => state.project.activeProject;

export default projectSlice.reducer;
