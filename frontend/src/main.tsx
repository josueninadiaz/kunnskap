import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppProviders } from './app/providers'
import { routes } from './app/routes'
import './styles/index.css'

const router = createBrowserRouter(routes)

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró el elemento #root.')

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
