# Cómo contribuir a Kunnskap

Gracias por tu interés en el proyecto. Toda ayuda es útil: corregir una errata, mejorar una explicación, añadir una prueba o desarrollar una funcionalidad. No necesitas acceso a ningún servicio privado para empezar.

## Antes de empezar

- Lee el [Código de conducta](CODE_OF_CONDUCT.md).
- Sigue la [guía de desarrollo local](docs/desarrollo-local.md) para ejecutar el proyecto en tu equipo.
- Si es tu primera contribución, busca issues con la etiqueta `buena primera contribución`.
- Si quieres hacer un cambio grande, abre antes una issue para comentarlo.

## Flujo de trabajo

1. Haz un *fork* del repositorio y crea una rama con un nombre descriptivo, por ejemplo `feat/busqueda-catalogo` o `fix/foco-menu`.
2. Haz cambios pequeños y coherentes. Un pull request debe resolver un solo problema.
3. Añade o actualiza las pruebas correspondientes.
4. Antes de abrir el pull request, ejecuta las comprobaciones:

   ```bash
   cd backend && dotnet build && dotnet test
   cd frontend && npm run lint && npm run typecheck && npm test && npm run build
   ```

5. Abre el pull request y completa la plantilla.

## Estándares de código

- **Backend:** el código se organiza por módulo en `backend/src/Academy.Api/Modules/<Módulo>`. Los avisos del compilador se tratan como errores. La autorización se comprueba siempre en el servidor.
- **Frontend:** TypeScript estricto, sin `any`. Los componentes deben ser accesibles: navegables con teclado, con etiquetas y con foco visible. Cada pantalla gestiona sus estados de carga, error, vacío y éxito.
- **Base de datos:** todo cambio de esquema se hace mediante una migración de EF Core (`dotnet ef migrations add <Nombre>`).
- **Seguridad:** nunca subas secretos, contraseñas reales ni datos personales. No uses `dangerouslySetInnerHTML`.
- **Textos de la interfaz:** en español claro, sin tecnicismos innecesarios y sin promesas exageradas.

## Contribuir con contenido educativo

- Cada afirmación técnica debe estar respaldada por documentación fiable. Enlaza la fuente.
- Indica qué material es original, cuál procede de terceros (con su licencia) y cuáles son referencias externas.
- Toda lección incluye una explicación, ejemplos, una actividad práctica y criterios para comprobar lo aprendido.
- Los laboratorios de seguridad deben ser legales y controlados. Nunca deben atacar sistemas de terceros.
- Al contribuir aceptas que tu contenido se publique bajo [CC BY-SA 4.0](LICENSE-CONTENT.md) y tu código bajo [GNU AGPL-3.0 o posterior](LICENSE), respetando la atribución al autor original de [NOTICE.md](NOTICE.md). Conservas los derechos de autor de tus aportaciones.

## Mensajes de commit

Usa mensajes breves en imperativo que expliquen el porqué, por ejemplo: `Añadir filtro por nivel en el catálogo`.
