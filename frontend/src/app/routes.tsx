import type { RouteObject } from 'react-router'
import { Page, PageLayout } from '../components/ui/Container'
import { HomePage } from '../features/home/HomePage'
import { RootLayout } from './RootLayout'
import { NotFoundPage, RouteError } from './RouteError'

/*
 * La portada se incluye en el paquete inicial; el resto de páginas se descargan al visitarlas
 * (división de código por ruta), para que la primera carga sea ligera en conexiones lentas.
 */
const lazyPage = (load: () => Promise<{ Component: React.ComponentType }>) => ({ lazy: load })

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
          {
            path: 'cursos/:slug',
            ...lazyPage(async () => ({ Component: (await import('../features/catalog/CourseDetailPage')).CourseDetailPage })),
          },
          {
            element: <PageLayout />,
            children: [
              { path: 'cursos', ...lazyPage(async () => ({ Component: (await import('../features/catalog/CatalogPage')).CatalogPage })) },
              {
                path: 'cursos/:slug/cuestionarios/:quizSlug',
                ...lazyPage(async () => ({ Component: (await import('../features/assessments/QuizPage')).QuizPage })),
              },
              {
                path: 'cursos/:slug/lecciones/:lessonSlug',
                ...lazyPage(async () => ({ Component: (await import('../features/learning/LessonPage')).LessonPage })),
              },
              { path: 'contribuir', ...lazyPage(async () => ({ Component: (await import('../features/contribute/ContributePage')).ContributePage })) },
              { path: 'estado', ...lazyPage(async () => ({ Component: (await import('../features/status/StatusPage')).StatusPage })) },
              { path: 'entrar', ...lazyPage(async () => ({ Component: (await import('../features/auth/LoginPage')).LoginPage })) },
              { path: 'registro', ...lazyPage(async () => ({ Component: (await import('../features/auth/RegisterPage')).RegisterPage })) },
              { path: 'privacidad', ...lazyPage(async () => ({ Component: (await import('../features/legal/PrivacyPage')).PrivacyPage })) },
              {
                path: 'accesibilidad',
                ...lazyPage(async () => ({ Component: (await import('../features/legal/AccessibilityPage')).AccessibilityPage })),
              },
              { path: 'herramientas', ...lazyPage(async () => ({ Component: (await import('../features/tools/ToolboxPage')).ToolboxPage })) },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]
