---
slug: prepara-tu-entorno
title: Prepara tu entorno
estimatedMinutes: 25
---
Para programar en C# necesitas dos cosas:

1. El **SDK de .NET 10**: las herramientas que traducen y ejecutan tu código. Es gratuito.
2. Un **editor de texto** donde escribir el código. Recomendamos [Visual Studio Code](https://code.visualstudio.com/), que es gratuito, pero cualquier editor de texto plano sirve (no uses Word: añade formato que el código no entiende).

Puedes trabajar de dos formas. Elige **una**.

### Opción A: en tu computadora

1. Entra en la [página de descarga de .NET 10](https://dotnet.microsoft.com/download/dotnet/10.0).
2. En la columna **SDK**, descarga el instalador para tu sistema (Windows, macOS o Linux). Ojo: necesitas el **SDK**, no solo el *Runtime*; el Runtime ejecuta programas, pero no permite crearlos.
3. Ejecuta el instalador y sigue los pasos. En Linux, la [guía de instalación oficial](https://learn.microsoft.com/dotnet/core/install/) explica cómo hacerlo con el gestor de paquetes de tu distribución.
4. Abre una **terminal** (en Windows, «Terminal» o «Símbolo del sistema»; en macOS, «Terminal») y escribe:

```bash
dotnet --version
```

Si la instalación funcionó, verás un número de versión que empieza por `10.`, por ejemplo:

```text
10.0.401
```

El número exacto puede ser otro; lo importante es que empiece por `10`. Si aparece un mensaje como «dotnet no se reconoce como un comando», cierra la terminal, ábrela de nuevo y vuelve a probar: la terminal solo detecta los programas instalados después de reiniciarla.

### Opción B: en el navegador con GitHub Codespaces

Si no puedes instalar programas (por ejemplo, en una computadora compartida), puedes programar desde el navegador con [GitHub Codespaces](https://docs.github.com/es/codespaces/overview). Necesitas una cuenta gratuita de GitHub. Todas las cuentas personales incluyen una cuota gratuita de uso cada mes (consulta los [límites vigentes](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces)); **detén el codespace cuando termines** para no gastarla.

1. Inicia sesión en GitHub y entra en <https://github.com/codespaces>.
2. En la sección **Explore quick start templates**, pulsa **See all**, busca la plantilla **Blank** (en blanco) y pulsa **Use this template**. Se abrirá un editor parecido a Visual Studio Code dentro del navegador, con una terminal en la parte inferior.
3. En la terminal, comprueba la versión de .NET:

```bash
dotnet --version
```

4. Si el número **no** empieza por `10`, instala .NET 10 con el [script de instalación oficial](https://learn.microsoft.com/dotnet/core/tools/dotnet-install-script) y añádelo a la ruta de la terminal:

```bash
curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 10.0
export PATH="$HOME/.dotnet:$PATH"
dotnet --version
```

La línea `export` solo dura mientras la terminal esté abierta; si abres una nueva, vuelve a ejecutarla.

### Tu carpeta de prácticas

Crea una carpeta llamada `practicas` para guardar todos los programas del curso. Desde la terminal:

```bash
mkdir practicas
cd practicas
```

`mkdir` crea la carpeta y `cd` entra en ella. A partir de ahora, ejecuta los comandos del curso dentro de esa carpeta.

### Referencias

- [Descargar .NET 10](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Instalar .NET en Windows, macOS y Linux](https://learn.microsoft.com/dotnet/core/install/)
- [Script dotnet-install](https://learn.microsoft.com/dotnet/core/tools/dotnet-install-script)
- [Qué es GitHub Codespaces](https://docs.github.com/es/codespaces/overview)
- [Crear un codespace a partir de una plantilla](https://docs.github.com/es/codespaces/developing-in-a-codespace/creating-a-codespace-from-a-template)

## Actividad práctica

1. Instala .NET 10 con la opción A o prepara un codespace con la opción B.
2. Ejecuta `dotnet --version` y anota el número que aparece.
3. Crea la carpeta `practicas` y entra en ella con `cd`.

## Comprueba lo aprendido

- `dotnet --version` muestra una versión que empieza por `10`.
- Sabes abrir una terminal y moverte a tu carpeta `practicas` con `cd`.
- Puedes explicar la diferencia entre el SDK y el Runtime de .NET.
- Si usas Codespaces, sabes detenerlo al terminar para no gastar tu cuota gratuita.
