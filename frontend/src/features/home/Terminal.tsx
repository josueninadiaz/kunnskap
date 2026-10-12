/**
 * Terminal ilustrativo de la portada: muestra el primer programa del curso de C#, el mismo de la
 * lección «Tu primer programa». Es decorativo para lectores de pantalla (se describe en el pie).
 */
export function Terminal() {
  return (
    <figure className="w-full max-w-xl">
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-[1.1rem] border border-stage-border bg-stage-raised shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]"
      >
        <div className="flex items-center gap-2 border-b border-stage-border px-4 py-3">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-stage-muted">practicas — terminal</span>
        </div>
        <div className="space-y-4 p-5 font-mono text-[0.8125rem] leading-relaxed sm:p-6 sm:text-sm">
          <div>
            <p className="text-stage-muted"># hola.cs</p>
            <p>
              <span className="text-[#7cc4ff]">Console</span>.<span className="text-[#ffd479]">WriteLine</span>(
              <span className="text-stage-accent">"¡Hola, mundo!"</span>);
            </p>
          </div>
          <div>
            <p>
              <span className="text-stage-accent">~/practicas</span> <span className="text-stage-muted">$</span>{' '}
              <span className="inline-block whitespace-nowrap motion-safe:animate-[type_1.6s_steps(18)_0.4s_both]">
                dotnet run hola.cs
              </span>
            </p>
            <p className="motion-safe:animate-[rise_0.4s_ease-out_2.1s_both]">¡Hola, mundo!</p>
            <p>
              <span className="text-stage-accent">~/practicas</span> <span className="text-stage-muted">$</span>{' '}
              <span className="inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] bg-stage-fg motion-safe:animate-[caret_1s_steps(1)_infinite]" />
            </p>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-sm text-stage-muted">
        Tu primer programa en C#: una línea y un comando. Lo escribirás en la lección 3 de «Programar desde cero con C#».
      </figcaption>
    </figure>
  )
}
