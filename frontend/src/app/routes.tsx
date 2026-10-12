import type { RouteObject } from 'react-router'
import { ContributePage } from '../features/contribute/ContributePage'
import { HomePage } from '../features/home/HomePage'
import { StatusPage } from '../features/status/StatusPage'
import { RootLayout } from './RootLayout'
import { NotFoundPage, RouteError } from './RouteError'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'contribuir', element: <ContributePage /> },
          { path: 'estado', element: <StatusPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
