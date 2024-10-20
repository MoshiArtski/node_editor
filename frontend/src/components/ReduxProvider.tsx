'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store'; // Ensure the store is imported

export default function ReduxProvider({ children }) {
  return <Provider store={store}>{children}</Provider>; // Correctly pass the store here
}
