---
slug: operadores
title: Hacer cálculos con operadores
estimatedMinutes: 20
---
Los programas calculan constantemente: precios, notas, tiempos. Para eso se usan los **operadores**.

### Operadores aritméticos

```csharp
Console.WriteLine(7 + 2);
Console.WriteLine(7 - 2);
Console.WriteLine(7 * 2);
Console.WriteLine(7 / 2);
Console.WriteLine(7 % 2);
```

```text
9
5
14
3
1
```

- `+` suma, `-` resta y `*` multiplica.
- `/` divide. ¡Cuidado! `7 / 2` da `3`, no `3.5`.
- `%` da el **resto** de la división: 7 entre 2 es 3 y sobra 1.

### La trampa de la división entera

Cuando divides dos números enteros (`int`), C# hace una división entera y descarta los decimales. Si al menos uno de los números tiene decimales, el resultado también los tiene:

```csharp
Console.WriteLine(7.0 / 2);
```

```text
3.5
```

### El orden de las operaciones

Como en matemáticas, primero se multiplica y divide, y después se suma y resta. Los paréntesis cambian el orden:

```csharp
Console.WriteLine(2 + 3 * 4);
Console.WriteLine((2 + 3) * 4);
```

```text
14
20
```

### Calcular con variables

```csharp
var precio = 12.5;
var cantidad = 3;
Console.WriteLine($"Total: {precio * cantidad}");
```

```text
Total: 37.5
```

Dentro de las llaves de la interpolación puedes escribir cualquier cálculo.

### El `+` también une textos

Con textos, `+` no suma: los une (se dice que los **concatena**).

```csharp
Console.WriteLine("Hola, " + "Ana");
Console.WriteLine("Edad: " + 17);
```

```text
Hola, Ana
Edad: 17
```

Si unes un texto con un número, el número se convierte en texto. La interpolación (`$"Edad: {edad}"`) hace lo mismo y suele leerse mejor.

### Referencias

- [Operadores aritméticos](https://learn.microsoft.com/dotnet/csharp/language-reference/operators/arithmetic-operators) (Microsoft Learn)

## Actividad práctica

Crea `compras.cs` para calcular una compra:

1. Guarda el precio de un cuaderno (`double`) y cuántos compras (`int`).
2. Calcula y muestra el total.
3. Si pagas con un billete de 50, muestra cuánto te devuelven.
4. Bonus: tienes 17 caramelos para repartir entre 5 personas. Usa `/` y `%` para mostrar cuántos recibe cada una y cuántos sobran.

## Comprueba lo aprendido

- Tu programa calcula el total y el cambio correctamente.
- Puedes explicar por qué `7 / 2` da `3` y cómo obtener `3.5`.
- Sabes qué hace el operador `%`.
- Sabes que `+` suma números pero une textos.
