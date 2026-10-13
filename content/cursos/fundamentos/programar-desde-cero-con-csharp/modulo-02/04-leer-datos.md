---
slug: leer-datos
title: Pedir datos a la persona usuaria
estimatedMinutes: 25
---
Un programa es mucho más útil cuando puede **preguntar**. Para leer lo que alguien escribe en la consola se usa `Console.ReadLine()`.

### Leer un texto

```csharp
Console.Write("¿Cómo te llamas? ");
string? nombre = Console.ReadLine();
Console.WriteLine($"¡Hola, {nombre}!");
```

Al ejecutarlo, el programa espera a que escribas y pulses Intro:

```text
¿Cómo te llamas? Ana
¡Hola, Ana!
```

- `Console.Write` escribe **sin** saltar de línea, así la respuesta queda en la misma línea que la pregunta.
- `Console.ReadLine()` espera hasta que se pulsa Intro y devuelve lo escrito como texto.
- El `?` de `string?` indica que puede que no llegue ningún texto. Ocurre, por ejemplo, si la entrada se cierra sin escribir nada. Si lo quitas, C# te avisa con un *warning* (aviso):

```text
warning CS8600: Se va a convertir un literal nulo o un posible valor nulo en un tipo que no acepta valores NULL
```

Un aviso no impide ejecutar el programa, pero te señala algo que conviene revisar.

### Leer un número

`ReadLine` siempre devuelve **texto**, aunque escribas `17`. Para hacer cálculos hay que convertirlo con `int.Parse`:

```csharp
Console.Write("¿Cuántos años tienes? ");
string texto = Console.ReadLine() ?? "";
int edad = int.Parse(texto);
Console.WriteLine($"El año que viene tendrás {edad + 1} años.");
```

```text
¿Cuántos años tienes? 17
El año que viene tendrás 18 años.
```

El operador `??` significa «si no llegó nada, usa lo de la derecha»: aquí, un texto vacío.

### Cuando la entrada no es un número

Si alguien escribe `diecisiete`, el programa se detiene con una **excepción**, un error que ocurre mientras el programa se ejecuta:

```text
Unhandled exception. System.FormatException: The input string 'diecisiete' was not in a correct format.
```

Los mensajes de las excepciones suelen aparecer en inglés. Este dice que el texto no tiene el formato correcto: no es un número. En el próximo módulo aprenderás a comprobar la entrada con `int.TryParse` y una condición, para responder con un mensaje amable en lugar de detenerte.

### Referencias

- [Console.ReadLine](https://learn.microsoft.com/dotnet/api/system.console.readline) (Microsoft Learn)
- [Convertir una cadena en un número](https://learn.microsoft.com/dotnet/csharp/programming-guide/types/how-to-convert-a-string-to-a-number) (Microsoft Learn)

## Actividad práctica

Crea `calculadora.cs`, que:

1. Pida dos números enteros, uno detrás de otro.
2. Muestre su suma, su resta, su multiplicación y el resto de dividir el primero entre el segundo.

Pruébala con varios números. Después escribe una palabra en lugar de un número, observa la excepción y anota su nombre.

## Comprueba lo aprendido

- Tu calculadora pide dos números y muestra los cuatro resultados.
- Puedes explicar por qué hace falta `int.Parse` si `ReadLine` ya devuelve lo que escribiste.
- Sabes qué significa el `?` en `string?` y qué hace `??`.
- Anotaste el nombre de la excepción que aparece al escribir una palabra.
