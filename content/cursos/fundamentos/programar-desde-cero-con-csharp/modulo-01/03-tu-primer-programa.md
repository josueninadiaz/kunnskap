---
slug: tu-primer-programa
title: Tu primer programa
estimatedMinutes: 20
---
Vas a escribir y ejecutar tu primer programa en C#.

### 1. Crea el archivo

En tu editor, crea un archivo llamado `hola.cs` dentro de la carpeta `practicas`. La extensión `.cs` indica que contiene código C#. Escribe exactamente esta línea:

```csharp
Console.WriteLine("¡Hola, mundo!");
```

Guarda el archivo.

### 2. Ejecútalo

En la terminal, dentro de `practicas`, escribe:

```bash
dotnet run hola.cs
```

Verás:

```text
¡Hola, mundo!
```

La primera vez tarda unos segundos, porque .NET traduce (compila) tu código antes de ejecutarlo. Las siguientes veces, si no cambias el archivo, es más rápido.

### 3. Qué significa cada parte

```csharp
Console.WriteLine("¡Hola, mundo!");
```

- `Console` es la **consola**: la ventana de texto de la terminal.
- `WriteLine` es una instrucción que escribe una línea de texto en la consola. El punto entre `Console` y `WriteLine` indica que `WriteLine` pertenece a `Console`.
- Lo que va entre **paréntesis** es lo que le das a `WriteLine` para que lo escriba.
- El texto va entre **comillas dobles** (`"`). En programación, un texto así se llama **cadena de texto** (*string*). Puede llevar tildes, eñes y signos como `¡` o `¿`.
- El **punto y coma** (`;`) marca el final de la instrucción, como el punto final de una frase.

C# distingue entre **mayúsculas y minúsculas**: `Console.WriteLine` funciona, pero `console.writeline` no. En la próxima lección verás qué pasa cuando te equivocas.

### 4. Varias instrucciones

Un programa puede tener muchas instrucciones. Se ejecutan **en orden**, de arriba abajo. Crea `presentacion.cs`:

```csharp
Console.WriteLine("Me llamo Ana.");
Console.WriteLine("Estoy aprendiendo C#.");
Console.WriteLine("Hoy escribí mi primer programa.");
```

Ejecútalo con `dotnet run presentacion.cs`:

```text
Me llamo Ana.
Estoy aprendiendo C#.
Hoy escribí mi primer programa.
```

Cambia el orden de las líneas, guarda y vuelve a ejecutar: la salida cambia de orden también.

### Referencias

- [Console.WriteLine](https://learn.microsoft.com/dotnet/api/system.console.writeline) (Microsoft Learn)
- [Instrucciones de nivel superior en C#](https://learn.microsoft.com/dotnet/csharp/fundamentals/program-structure/top-level-statements): por qué un programa puede ser una sola línea.
- [Aplicaciones de un solo archivo](https://learn.microsoft.com/dotnet/core/sdk/file-based-apps)

## Actividad práctica

1. Crea `hola.cs` y ejecútalo.
2. Crea `presentacion.cs` con **al menos tres líneas** sobre ti: tu nombre (o un apodo), algo que te guste y por qué quieres aprender a programar.
3. Ejecútalo, cambia el orden de dos líneas y vuelve a ejecutarlo.

## Comprueba lo aprendido

- `dotnet run hola.cs` muestra `¡Hola, mundo!` sin errores.
- Tu `presentacion.cs` muestra al menos tres líneas en el orden en que las escribiste.
- Puedes explicar qué hacen `Console.WriteLine`, las comillas, los paréntesis y el punto y coma.
- Sabes que las instrucciones se ejecutan en orden, de arriba abajo.
