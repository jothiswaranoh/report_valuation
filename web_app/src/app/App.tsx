// app/App.tsx
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import router from './router';
import { AppProvider } from './providers';
import { AppStoreProvider } from '../store/useAppStore';

// Create Query Client (ONE TIME)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppStoreProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </AppStoreProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
