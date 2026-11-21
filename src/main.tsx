import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/AuthProvider'
import { AppErrorBoundary } from '@/app/AppErrorBoundary'
import { queryClient } from '@/app/queryClient'
import { AppRouter } from '@/app/router'
import { ToastProvider } from '@/components/ui'
import '@/styles/global.css'

const container = document.getElementById('root')
if (!container) throw new Error("Élément #root absent de index.html : impossible de monter LEONIDA.")

createRoot(container).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
