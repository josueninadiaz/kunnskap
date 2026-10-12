---
slug: cuando-algo-falla
title: Cuando algo falla, leer los errores
estimatedMinutes: 20
---
Todas las personas que programan se equivocan, todos los días. La diferencia entre quien empieza y quien tiene experiencia no es equivocarse menos, sino **leer los errores** y corregirlos rápido. Los mensajes de error no son un castigo: son pistas.

### Anatomía de un mensaje de error

Escribe este programa en `sin-punto-y-coma.cs`, **sin** el punto y coma final:

```csharp
Console.WriteLine("Hola")
```

Al ejecutar `dotnet run sin-punto-y-coma.cs` verás algo como:

```text
sin-punto-y-coma.cs(1,26): error CS1002: Se esperaba ;

The build failed. Fix the build errors and run again.
```

(Antes del nombre del archivo aparecerá también la carpeta donde está.) El mensaje tiene cuatro partes:

- `sin-punto-y-coma.cs`: el **archivo** donde está el error.
- `(1,26)`: la **línea 1**, **columna 26**, el lugar exacto donde el compilador se dio cuenta del problema.
- `CS1002`: el **código** del error. Cada tipo de error tiene el suyo.
- `Se esperaba ;`: la **explicación**, en este caso que falta un punto y coma.

La última línea (*The build failed…*) dice que el programa no se pudo compilar, así que no se ejecutó. Añade el `;`, guarda y vuelve a ejecutar.

> El texto del mensaje depende del idioma de tu sistema: puede aparecer en español o en inglés. El **código** (`CS1002`) es siempre el mismo, así que es lo mejor para buscar ayuda.

### Mayúsculas y minúsculas

En `mayusculas.cs`:

```csharp
Console.Writeline("Hola");
```

El resultado:

```text
mayusculas.cs(1,9): error CS0117: 'Console' no contiene una definición para 'Writeline'
```

`Writeline` (con `l` minúscula) no existe: la instrucción correcta es `WriteLine`. Para C#, son palabras distintas.

### Un error que provoca otros

En `comillas.cs`, olvida cerrar las comillas:

```csharp
Console.WriteLine("Hola);
```

Esta vez aparecen **tres** errores:

```text
comillas.cs(1,19): error CS1010: Nueva línea en constante
comillas.cs(1,26): error CS1026: Se esperaba )
comillas.cs(1,26): error CS1002: Se esperaba ;
```

Como las comillas no se cierran, el compilador cree que `);` forma parte del texto, y por eso tampoco encuentra el paréntesis ni el punto y coma. Hay un solo error real, pero provoca otros.

**Regla práctica: corrige siempre el primer error y vuelve a ejecutar.** A menudo los demás desaparecen solos.

### Cómo buscar ayuda

1. Copia el código del error (por ejemplo, `CS1010`).
2. Búscalo en la [lista oficial de mensajes del compilador de C#](https://learn.microsoft.com/dotnet/csharp/language-reference/compiler-messages/) o en un buscador junto con la palabra «C#».
3. Lee la explicación y compara con tu línea de código.

### Referencias

- [Mensajes de error y advertencia del compilador de C#](https://learn.microsoft.com/dotnet/csharp/language-reference/compiler-messages/) (Microsoft Learn)

## Actividad práctica

Parte de tu `hola.cs`, que ya funciona. Para cada caso, provoca el error, ejecuta, **lee** el mensaje (archivo, línea, columna, código) y corrígelo antes de pasar al siguiente:

1. Quita el punto y coma.
2. Escribe `console` con minúscula.
3. Quita las comillas de cierre.
4. Quita el paréntesis de cierre.

Para el caso 4 no te damos el mensaje: anótalo tú, con su código.

## Comprueba lo aprendido

- Sabes encontrar en un mensaje de error el archivo, la línea, la columna y el código.
- Corregiste los cuatro errores de la actividad y tu programa vuelve a mostrar `¡Hola, mundo!`.
- Anotaste el código de error del caso 4.
- Puedes explicar por qué conviene corregir primero el primer error.
