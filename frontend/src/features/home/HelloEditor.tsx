import { useId, useState } from 'react'
import { sanitizeName } from './helloProgram'

/**
 * Primer programa editable de la portada. Es C# real (interpolación de cadenas); la salida es una
 * vista previa calculada en el navegador, idéntica a la que imprimiría `dotnet run`.
 */
export function HelloEditor() {
  const [name, setName] = useState('Ana')
  const inputId = useId()
  const width = `${Math.max(name.length, 2) + 0.4}ch`

  return (
    <figure className="mx-auto w-full max-w-2xl text-left">
      <div className="overflow-hidden rounded-[1.25rem] border border-border bg-code-bg shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="font-mono text-[0.8125rem] text-code-comment">hola.cs</span>
          <label htmlFor={inputId} className="text-[0.8125rem] font-medium text-fg-muted">
            Escribe tu nombre en el código
          </label>
        </div>

        <pre className="overflow-x-auto px-4 py-5 font-mono text-[0.78rem] leading-[1.9] text-code-fg sm:px-5 sm:text-base">
          <code>
            <span className="mr-3 inline-block w-3 text-right text-code-comment select-none sm:mr-5">1</span>
            <span className="text-code-keyword">var</span> nombre = <span className="text-code-string">"</span>
            <input
              id={inputId}
              value={name}
              onChange={(e) => setName(sanitizeName(e.target.value))}
              spellCheck={false}
              autoComplete="off"
              maxLength={24}
              style={{ width }}
              className="rounded-md bg-accent-soft px-0.5 font-mono text-code-string caret-accent outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
            <span className="text-code-string">"</span>;{'\n'}
            <span className="mr-3 inline-block w-3 text-right text-code-comment select-none sm:mr-5">2</span>
            <span className="text-code-type">Console</span>.<span className="text-code-method">WriteLine</span>(
            <span className="text-code-string">$"¡Hola, </span>
            {'{'}nombre{'}'}
            <span className="text-code-string">!"</span>);
          </code>
        </pre>

        <div className="border-t border-border bg-surface px-4 py-4 font-mono text-[0.875rem] sm:px-5 sm:text-base">
          <p className="text-code-comment">
            <span aria-hidden="true">$ </span>dotnet run hola.cs
          </p>
          <output htmlFor={inputId} aria-live="polite" className="block font-semibold text-fg">
            ¡Hola, {name}!
          </output>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-[0.9375rem] text-fg-muted">
        Esto es C# real. En el curso aprenderás a escribirlo y ejecutarlo en tu computadora.
      </figcaption>
    </figure>
  )
}
