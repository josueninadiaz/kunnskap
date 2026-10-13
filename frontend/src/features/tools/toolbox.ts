/*
 * Caja de herramientas: recursos gratuitos seleccionados para quien aprende.
 * Criterios: gratis para aprender, sin tarjeta de crédito, HTTPS y, en las APIs, sin clave y con
 * CORS (se pueden usar desde una página web). Cada enlace se comprobó en la fecha indicada.
 * Para proponer cambios, edita este archivo en un pull request.
 */

export const LAST_CHECKED = '2026-10-12'

export interface Tool {
  name: string
  url: string
  description: string
  /** Tecnología o servicio de Microsoft (incluido GitHub). */
  microsoft?: boolean
}

export interface ToolGroup {
  id: string
  title: string
  intro: string
  tools: Tool[]
}

export const toolGroups: ToolGroup[] = [
  {
    id: 'programar',
    title: 'Para programar sin pagar nada',
    intro: 'Todo lo que necesitas para escribir y ejecutar tus programas.',
    tools: [
      { name: 'SDK de .NET 10', url: 'https://dotnet.microsoft.com/download/dotnet/10.0', description: 'Las herramientas para crear y ejecutar programas en C#. Gratis y para Windows, macOS y Linux.', microsoft: true },
      { name: 'Visual Studio Code', url: 'https://code.visualstudio.com/', description: 'Editor de código gratuito y ligero, con extensiones para C# y casi cualquier lenguaje.', microsoft: true },
      { name: 'GitHub Codespaces', url: 'https://github.com/features/codespaces', description: 'Un entorno de programación completo en el navegador, con una cuota gratuita mensual. Ideal si no puedes instalar nada.', microsoft: true },
      { name: '.NET Fiddle', url: 'https://dotnetfiddle.net/', description: 'Ejecuta código C# en el navegador al instante, sin cuenta. Perfecto para probar una idea rápida.' },
      { name: 'Git', url: 'https://git-scm.com/', description: 'Guarda el historial de tu código y colabora con otras personas.' },
    ],
  },
  {
    id: 'aprender',
    title: 'Para aprender y practicar',
    intro: 'Complementos excelentes y gratuitos a los cursos de Kunnskap.',
    tools: [
      { name: 'Microsoft Learn', url: 'https://learn.microsoft.com/es-es/training/', description: 'Rutas de formación gratuitas y en español sobre C#, .NET, Azure e inteligencia artificial.', microsoft: true },
      { name: 'Recorrido por C#', url: 'https://learn.microsoft.com/es-es/dotnet/csharp/tour-of-csharp/', description: 'La introducción oficial al lenguaje C#, en español.', microsoft: true },
      { name: 'Exercism: C#', url: 'https://exercism.org/tracks/csharp', description: 'Ejercicios de C# con corrección automática y mentoría voluntaria gratuita.' },
      { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/es/', description: 'La referencia de HTML, CSS y JavaScript, con buena parte traducida al español.' },
      { name: 'freeCodeCamp en español', url: 'https://www.freecodecamp.org/espanol/', description: 'Artículos y cursos gratuitos de programación en español.' },
      { name: 'GitHub Student Developer Pack', url: 'https://education.github.com/pack', description: 'Si estudias en un centro educativo, herramientas profesionales gratis mientras estudies.', microsoft: true },
    ],
  },
  {
    id: 'accesibilidad',
    title: 'Accesibilidad',
    intro: 'Herramientas gratuitas para navegar y aprender sin barreras.',
    tools: [
      { name: 'NVDA', url: 'https://www.nvaccess.org/download/', description: 'Lector de pantalla gratuito y de código abierto para Windows.' },
      { name: 'Lectores de pantalla del sistema', url: '/accesibilidad', description: 'VoiceOver (macOS, iPhone), TalkBack (Android) y Narrador (Windows) vienen incluidos. Kunnskap funciona con ellos.' },
    ],
  },
]

export interface PublicApi {
  name: string
  docs: string
  /** Petición de ejemplo que se puede abrir en el navegador. */
  example: string
  description: string
  /** Idea de proyecto para principiantes. */
  idea: string
  category: string
  /** Avisos (idioma, límites de uso…). */
  note?: string
}

export const publicApis: PublicApi[] = [
  { name: 'Open-Meteo', docs: 'https://open-meteo.com/en/docs', example: 'https://api.open-meteo.com/v1/forecast?latitude=-12.05&longitude=-77.04&current=temperature_2m', description: 'El tiempo actual y la previsión de cualquier lugar del mundo.', idea: 'Una app que te diga si hoy necesitas paraguas.', category: 'Tiempo y naturaleza' },
  { name: 'Sunrise Sunset', docs: 'https://sunrise-sunset.org/api', example: 'https://api.sunrise-sunset.org/json?lat=40.4&lng=-3.7', description: 'Horas de salida y puesta del sol para unas coordenadas.', idea: 'Un contador de horas de luz de tu ciudad.', category: 'Tiempo y naturaleza' },
  { name: 'Nager.Date', docs: 'https://date.nager.at/Api', example: 'https://date.nager.at/api/v3/PublicHolidays/2026/MX', description: 'Días festivos oficiales de más de cien países.', idea: 'Un calendario que avise del próximo feriado de tu país.', category: 'Datos útiles' },
  { name: 'Frankfurter', docs: 'https://frankfurter.dev/', example: 'https://api.frankfurter.dev/v1/latest?from=USD&to=EUR,MXN', description: 'Tipos de cambio entre monedas, con datos del Banco Central Europeo.', idea: 'Un conversor de monedas para tus viajes o compras.', category: 'Datos útiles' },
  { name: 'Open Food Facts', docs: 'https://openfoodfacts.github.io/openfoodfacts-server/api/', example: 'https://world.openfoodfacts.org/api/v2/product/737628064502.json', description: 'Información nutricional de millones de productos, con datos abiertos.', idea: 'Un lector de ingredientes a partir del código de barras.', category: 'Datos útiles' },
  { name: 'Wikipedia (REST)', docs: 'https://es.wikipedia.org/api/rest_v1/', example: 'https://es.wikipedia.org/api/rest_v1/page/summary/Noruega', description: 'Resúmenes de artículos de Wikipedia en español.', idea: 'Un buscador de datos curiosos para tus tareas.', category: 'Conocimiento y cultura' },
  { name: 'The Met Museum', docs: 'https://metmuseum.github.io/', example: 'https://collectionapi.metmuseum.org/public/collection/v1/objects/436535', description: 'Obras de arte del Museo Metropolitano de Nueva York, con imágenes.', idea: 'Una galería con una obra de arte al azar cada día.', category: 'Conocimiento y cultura' },
  { name: 'Open Trivia DB', docs: 'https://opentdb.com/api_config.php', example: 'https://opentdb.com/api.php?amount=5', description: 'Preguntas de cultura general de varias categorías y dificultades.', idea: 'Un juego de preguntas con puntuación.', category: 'Juegos y entretenimiento', note: 'Las preguntas están en inglés.' },
  { name: 'PokéAPI', docs: 'https://pokeapi.co/docs/v2', example: 'https://pokeapi.co/api/v2/pokemon/pikachu', description: 'Todos los datos de los Pokémon: tipos, habilidades e imágenes.', idea: 'Una pokédex con buscador.', category: 'Juegos y entretenimiento' },
  { name: 'Rick and Morty API', docs: 'https://rickandmortyapi.com/documentation', example: 'https://rickandmortyapi.com/api/character/1', description: 'Personajes, lugares y episodios de la serie.', idea: 'Un catálogo de personajes con paginación.', category: 'Juegos y entretenimiento' },
  { name: 'Dog CEO', docs: 'https://dog.ceo/dog-api/', example: 'https://dog.ceo/api/breeds/image/random', description: 'Fotos de perros por raza.', idea: 'Un botón que muestre un perro distinto cada vez.', category: 'Animales' },
  { name: 'The Cat API', docs: 'https://developers.thecatapi.com/', example: 'https://api.thecatapi.com/v1/images/search', description: 'Fotos de gatos al azar.', idea: 'Una galería de gatos con «me gusta».', category: 'Animales', note: 'Las búsquedas avanzadas requieren una clave gratuita.' },
  { name: 'Cat Facts', docs: 'https://catfact.ninja/', example: 'https://catfact.ninja/fact', description: 'Datos curiosos sobre gatos.', idea: 'Un dato curioso en la pantalla de inicio de tu app.', category: 'Animales', note: 'Los datos están en inglés.' },
  { name: 'JSONPlaceholder', docs: 'https://jsonplaceholder.typicode.com/', example: 'https://jsonplaceholder.typicode.com/todos/1', description: 'Datos falsos (tareas, usuarios, publicaciones) para practicar sin servidor.', idea: 'Tu primera lista de tareas conectada a una API.', category: 'Para practicar' },
  { name: 'Random User', docs: 'https://randomuser.me/documentation', example: 'https://randomuser.me/api/?nat=es', description: 'Perfiles de personas ficticias, con nombre, foto y país.', idea: 'Una agenda de contactos de prueba.', category: 'Para practicar' },
  { name: 'Advice Slip', docs: 'https://api.adviceslip.com/', example: 'https://api.adviceslip.com/advice', description: 'Un consejo al azar.', idea: 'Una app de un consejo al día.', category: 'Para practicar', note: 'Los consejos están en inglés.' },
  { name: 'GitHub REST API', docs: 'https://docs.github.com/es/rest', example: 'https://api.github.com/repos/dotnet/runtime', description: 'Información pública de repositorios, usuarios y proyectos de GitHub.', idea: 'Una tarjeta que muestre tus repositorios y estrellas.', category: 'Para practicar', note: 'Sin clave permite 60 peticiones por hora.' },
]

export const directories = [
  { name: 'publicapis.dev', url: 'https://publicapis.dev/', description: 'Directorio con cientos de APIs públicas, con buscador por categoría.' },
  { name: 'public-apis en GitHub', url: 'https://github.com/public-apis/public-apis', description: 'La lista colaborativa más conocida de APIs públicas gratuitas.' },
] as const
