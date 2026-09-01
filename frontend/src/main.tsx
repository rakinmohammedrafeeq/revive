import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { onAuthStateChange } from '@/store/authStore'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

// Ensure user-scoped data (expenses, transactions, etc.) is refreshed on login/logout
// without requiring a full page reload.
onAuthStateChange(() => {
  // Remove cached data and cancel in-flight requests so the next screen shows
  // the newly authenticated user's data.
  queryClient.cancelQueries()
  queryClient.clear()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <App />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
