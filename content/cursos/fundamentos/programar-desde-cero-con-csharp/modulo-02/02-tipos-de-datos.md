---
slug: tipos-de-datos
title: Tipos de datos
estimatedMinutes: 20
---
Cada dato tiene un **tipo**: no es lo mismo un texto que un número o un «sí o no». El tipo le dice a C# qué puedes hacer con ese dato: los números se pueden sumar; los textos, no.

### Los tipos que más usarás

- `string`: texto, siempre entre comillas dobles. Ejemplo: `"Lima"`.
- `int`: números enteros, sin decimales. Ejemplo: `25`.
- `double`: números con decimales. En el código se escriben con **punto**, no con coma: `18.5`.
- `bool`: verdadero o falso. Solo puede valer `true` o `false`.
- `char`: un solo carácter, entre comillas simples. Ejemplo: `'K'`.

Puedes escribir el tipo en lugar de `var`:

```csharp
string ciudad = "Lima";
int alumnos = 25;
double temperatura = 18.5;
bool llueve = false;
char inicial = 'K';
Console.WriteLine($"{ciudad}: {alumnos} alumnos, {temperatura} grados, ¿llueve? {llueve}, inicial {inicial}");
```

```text
Lima: 25 alumnos, 18.5 grados, ¿llueve? False, inicial K
```

Fíjate en dos detalles de la salida: el decimal se muestra con punto y `false` aparece como `False`, con mayúscula.

### `var` o el tipo: ¿cuál uso?

Con `var`, C# deduce el tipo a partir del valor: en `var edad = 17;`, `edad` es un `int`. El tipo existe igual, aunque no lo escribas. Escribir el tipo ayuda al principio a tener claro qué guarda cada variable; las dos formas son correctas.

### C# no mezcla tipos sin avisar

Una variable `int` no puede guardar un texto:

```csharp
int edad = "diecisiete";
```

```text
error CS0029: No se puede convertir implícitamente el tipo 'string' en 'int'
```

Este error es una ayuda: C# detecta el problema **antes** de ejecutar el programa.

### Decimales exactos: `decimal`

Los `double` son muy rápidos, pero algunos decimales no se pueden guardar de forma exacta:

```csharp
double a = 0.1 + 0.2;
Console.WriteLine(a);
decimal b = 0.1m + 0.2m;
Console.WriteLine(b);
```

```text
0.30000000000000004
0.3
```

Para dinero y cuentas que deben ser exactas se usa `decimal`, con una `m` al final del número. Para medidas como temperaturas o distancias, `double` es suficiente.

### Referencias

- [Tipos integrados de C#](https://learn.microsoft.com/dotnet/csharp/language-reference/builtin-types/built-in-types) (Microsoft Learn)
- [Tipos numéricos de punto flotante](https://learn.microsoft.com/dotnet/csharp/language-reference/builtin-types/floating-point-numeric-types) (Microsoft Learn)

## Actividad práctica

Crea `mochila.cs` con una variable de cada tipo que describa tu mochila o tu bolso: cuántas cosas lleva (`int`), cuánto pesa en kilos (`double`), si llevas paraguas (`bool`), de qué color es (`string`) y la inicial de tu nombre (`char`). Muestra todo en una sola frase con interpolación.

Luego provoca a propósito el error CS0029 guardando un texto en una variable `int`, lee el mensaje y corrígelo.

## Comprueba lo aprendido

- Tu programa usa los cinco tipos y muestra la frase sin errores.
- Sabes que en el código los decimales se escriben con punto.
- Puedes explicar cuándo usarías `decimal` en lugar de `double`.
- Provocaste y corregiste el error CS0029.
