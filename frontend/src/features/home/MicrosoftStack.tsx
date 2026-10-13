import csharpLogo from '../../assets/brand/csharp.svg'
import dotnetBot from '../../assets/brand/dotnet-bot-jetpack.png'
import dotnetLogo from '../../assets/brand/dotnet-logo.svg'
import { Container } from '../../components/ui/Container'

const tools = [
  { name: '.NET 10 y C#', use: 'El lenguaje y la plataforma de la ruta principal, desde el primer programa.' },
  { name: 'ASP.NET Core', use: 'APIs web profesionales, como la que hace funcionar esta plataforma.' },
  { name: 'Entity Framework Core', use: 'Bases de datos desde C#, con migraciones y consultas tipadas.' },
  { name: '.NET Aspire', use: 'Arrancar una aplicación completa con un comando y observarla.' },
  { name: 'Visual Studio Code y GitHub Codespaces', use: 'Programar en tu equipo o en el navegador, sin instalar nada.' },
  { name: 'GitHub', use: 'Guardar tu código, colaborar y publicar tus proyectos.' },
  { name: 'TypeScript', use: 'JavaScript con tipos, para interfaces web robustas.' },
  { name: 'Azure', use: 'Publicar tus aplicaciones en la nube (en preparación).' },
] as const

/** Sección que deja claro con qué tecnología de Microsoft se aprende y se construye Kunnskap. */
export function MicrosoftStack() {
  return (
    <section aria-labelledby="stack-title" className="bg-band py-20 sm:py-28">
      <Container className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img src={dotnetLogo} alt=".NET" width={64} height={64} className="size-14 rounded-2xl sm:size-16" />
            <img src={csharpLogo} alt="C#" width={64} height={64} className="size-14 sm:size-16" />
          </div>
          <h2 id="stack-title" className="headline">
            Aprende con la tecnología de Microsoft, de principio a fin.
          </h2>
          <p className="lead text-fg-muted">
            La ruta principal enseña C# y .NET, las mismas herramientas que usan equipos profesionales en todo el mundo. Y
            la propia plataforma está construida con ellas: lo que aprendes, lo puedes ver funcionando aquí.
          </p>
          <img
            src={dotnetBot}
            alt="El dotnet-bot, la mascota de .NET, volando con una mochila propulsora"
            width={250}
            height={250}
            loading="lazy"
            className="w-40 motion-safe:animate-[float_6s_ease-in-out_infinite] sm:w-48"
          />
          <p className="text-sm text-fg-muted">
            Kunnskap es un proyecto independiente de la comunidad, sin afiliación con Microsoft. .NET, C#, Azure, Visual
            Studio Code, GitHub y TypeScript son marcas de sus propietarios.
          </p>
        </div>

        <dl className="divide-y divide-border self-start border-y border-border">
          {tools.map((tool) => (
            <div key={tool.name} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <dt className="font-display text-lg font-semibold tracking-[-0.015em] text-dotnet-text">
                {tool.name}
              </dt>
              <dd className="text-fg-muted">{tool.use}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
