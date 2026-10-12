import ReactMarkdown, { type Components } from 'react-markdown'

/*
 * Renderizado seguro de Markdown: el HTML incrustado se descarta (skipHtml) y react-markdown
 * neutraliza URLs peligrosas (javascript:, data:). Nunca se usa dangerouslySetInnerHTML.
 */
const components: Components = {
  a: ({ href, children }) => {
    const external = href?.startsWith('http')
    return (
      <a
        href={href}
        className="font-medium text-accent underline"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  },
  code: ({ children }) => (
    <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>
  ),
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 marker:text-accent">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  img: ({ src, alt }) => <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" className="max-w-full" />,
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 [&_strong]:font-semibold">
      <ReactMarkdown skipHtml components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
