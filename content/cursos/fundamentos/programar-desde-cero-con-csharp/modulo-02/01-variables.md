---
slug: variables
title: Guardar datos en variables
estimatedMinutes: 20
---
Hasta ahora tus programas escribían siempre el mismo texto. Para que un programa trabaje con datos que cambian (un nombre, una edad, un precio) necesitas **variables**.

Una **variable** es un espacio con nombre donde el programa guarda un dato para usarlo después. Imagina una caja con una etiqueta: la etiqueta es el nombre y lo que hay dentro es el valor.

### Crear una variable

```csharp
var nombre = "Ana";
var edad = 17;
Console.WriteLine(nombre);
Console.WriteLine(edad);
```

Al ejecutarlo verás:

```text
Ana
17
```

- `var` le dice a C# que vas a crear una variable.
- `nombre` y `edad` son los nombres que eliges.
- El signo `=` **asigna** el valor: guarda lo de la derecha en la variable de la izquierda. No significa «es igual» como en matemáticas.

### Cambiar el valor

Una variable puede cambiar de valor. Para hacerlo, se escribe su nombre sin `var`:

```csharp
var nombre = "Ana";
var edad = 17;
edad = 18;
Console.WriteLine($"{nombre} tiene {edad} años.");
```

```text
Ana tiene 18 años.
```

El `$` delante de las comillas permite escribir variables entre llaves `{ }` dentro del texto. Se llama **interpolación de cadenas** y es la forma más cómoda de mezclar texto y datos.

### Errores frecuentes

Si usas una variable que no has creado:

```text
error CS0103: El nombre 'edad' no existe en el contexto actual
```

Si creas dos veces la misma variable con `var`:

```text
error CS0128: Una variable o función local denominada 'edad' ya se ha definido en este ámbito
```

### Cómo elegir buenos nombres

- Usa nombres que expliquen qué guardan: `precioTotal` mejor que `x`.
- Empieza con minúscula y une las palabras poniendo en mayúscula la primera letra de cada una: `numeroDeAlumnos`. Esta costumbre se llama *camelCase*.
- No pueden empezar con un número ni tener espacios.
- C# permite tildes y eñes (`año` funciona), pero en muchos equipos se evitan para no tener problemas con otros teclados.

### Referencias

- [Variables locales en C#](https://learn.microsoft.com/dotnet/csharp/language-reference/statements/declarations) (Microsoft Learn)
- [Interpolación de cadenas](https://learn.microsoft.com/dotnet/csharp/language-reference/tokens/interpolated) (Microsoft Learn)

## Actividad práctica

Crea `ficha.cs` con tres variables: tu nombre (o un apodo), tu ciudad y tu edad. Escribe una frase con interpolación, por ejemplo:

```text
Me llamo Ana, vivo en Lima y tengo 17 años.
```

Después cambia el valor de la edad sumándole un año (`edad = edad + 1;`) y escribe otra frase: «El año que viene tendré 18 años.»

## Comprueba lo aprendido

- Tu programa muestra las dos frases con tus datos.
- Puedes explicar qué hace el signo `=` en `edad = 18;`.
- Sabes para qué sirven el `$` y las llaves `{ }` en un texto.
- Reconoces los errores CS0103 y CS0128 y sabes cómo corregirlos.
