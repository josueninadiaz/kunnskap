import ReactMarkdown, { type Components } from 'react-markdown'

const components: Components = {
  p: ({ children }) => <>{children}</>,
  code: ({ children }) => <code className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-[0.9em] text-code-fg">{children}</code>,
}

/**
 * Markdown en línea (código, negrita, cursiva) para textos cortos que van dentro de etiquetas o
 * leyendas, donde no se permiten párrafos. Sin HTML incrustado.
 */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown skipHtml allowedElements={['p', 'code', 'strong', 'em']} unwrapDisallowed components={components}>
      {children}
    </ReactMarkdown>
  )
}
