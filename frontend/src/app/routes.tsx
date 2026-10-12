import type { RouteObject } from 'react-router'
import { Page, PageLayout } from '../components/ui/Container'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { CatalogPage } from '../features/catalog/CatalogPage'
import { CourseDetailPage } from '../features/catalog/CourseDetailPage'
import { ContributePage } from '../features/contribute/ContributePage'
import { LessonPage } from '../features/learning/LessonPage'
import { HomePage } from '../features/home/HomePage'
import { PrivacyPage } from '../features/legal/PrivacyPage'
import { StatusPage } from '../features/status/StatusPage'
import { RootLayout } from './RootLayout'
import { NotFoundPage, RouteError } from './RouteError'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        errorElement: (
          <Page>
            <RouteError />
          </Page>
        ),
        children: [
          // A sangre completa: tienen escenas oscuras de borde a borde.
          { index: true, element: <HomePage /> },
          { path: 'cursos/:slug', element: <CourseDetailPage /> },
          {
            element: <PageLayout />,
            children: [
              { path: 'cursos', element: <CatalogPage /> },
              { path: 'cursos/:slug/lecciones/:lessonSlug', element: <LessonPage /> },
              { path: 'contribuir', element: <ContributePage /> },
              { path: 'estado', element: <StatusPage /> },
              { path: 'entrar', element: <LoginPage /> },
              { path: 'registro', element: <RegisterPage /> },
              { path: 'privacidad', element: <PrivacyPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]
