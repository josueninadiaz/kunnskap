import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Constellation } from './layout'

/**
 * Escena 3D de la constelación (three.js). Este módulo se carga bajo demanda: solo se descarga
 * en equipos con WebGL que no piden reducir el movimiento ni ahorrar datos.
 */

const COLORS = {
  dotnet: new Color('#a594ff'),
  published: new Color('#6fe3b4'),
  course: new Color('#7f93ad'),
  pathEdge: new Color('#6fe3b4'),
  techEdge: new Color('#a594ff'),
  neutralEdge: new Color('#4b6584'),
}

/** Textura circular con halo para que los puntos brillen. */
function glowTexture(): CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.85)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.15)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function pointCloud(data: Constellation, kind: 'course' | 'technology', size: number, texture: CanvasTexture): Points {
  const positions: number[] = []
  const colors: number[] = []
  for (const node of data.nodes) {
    if (node.kind !== kind) continue
    positions.push(...node.position)
    const color = node.microsoft ? COLORS.dotnet : kind === 'course' && node.published ? COLORS.published : COLORS.course
    colors.push(color.r, color.g, color.b)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const material = new PointsMaterial({
    size,
    map: texture,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  })
  return new Points(geometry, material)
}

function edges(data: Constellation, pairs: [number, number][], color: (a: number, b: number) => Color, opacity: number): LineSegments {
  const positions: number[] = []
  const colors: number[] = []
  for (const [a, b] of pairs) {
    const c = color(a, b)
    positions.push(...data.nodes[a]!.position, ...data.nodes[b]!.position)
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const material = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false })
  return new LineSegments(geometry, material)
}

export interface SceneHandle {
  dispose(): void
}

/**
 * @param labels Elementos HTML (enlaces) de cada nodo de tecnología, por índice de nodo.
 *               La escena los coloca encima del lienzo en cada fotograma.
 */
export function createConstellationScene(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  data: Constellation,
  labels: Map<number, HTMLElement>,
): SceneHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new Scene()
  const camera = new PerspectiveCamera(42, 1, 0.1, 50)
  camera.position.set(0, 0, 3.9)

  const texture = glowTexture()
  const group = new Group()
  group.rotation.x = 0.35
  group.add(edges(data, data.pathEdges, () => COLORS.pathEdge, 0.55))
  group.add(
    edges(data, data.technologyEdges, (_, tech) => (data.nodes[tech]!.microsoft ? COLORS.techEdge : COLORS.neutralEdge), 0.22),
  )
  group.add(pointCloud(data, 'course', 0.13, texture))
  group.add(pointCloud(data, 'technology', 0.3, texture))
  scene.add(group)

  // Campo de estrellas tenue, que gira más despacio y da profundidad.
  const starPositions: number[] = []
  for (let i = 0; i < 420; i++) {
    const r = 3 + Math.random() * 4
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPositions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
  }
  const starGeometry = new BufferGeometry()
  starGeometry.setAttribute('position', new Float32BufferAttribute(starPositions, 3))
  const stars = new Points(
    starGeometry,
    new PointsMaterial({ size: 0.035, color: new Color('#9fb3cc'), transparent: true, opacity: 0.55, depthWrite: false }),
  )
  scene.add(stars)

  // Rotación: automática y lenta; arrastrar la gira. Se detiene si el teclado enfoca una etiqueta.
  let velocity = 0.0012
  let dragging = false
  let lastX = 0
  let lastY = 0
  let paused = false

  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('a')) return
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    container.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    group.rotation.y += (e.clientX - lastX) * 0.006
    group.rotation.x = Math.max(-1, Math.min(1, group.rotation.x + (e.clientY - lastY) * 0.004))
    velocity = (e.clientX - lastX) * 0.0004
    lastX = e.clientX
    lastY = e.clientY
  }
  const onPointerUp = () => {
    dragging = false
  }
  const onFocusIn = () => {
    paused = true
  }
  const onFocusOut = () => {
    paused = false
  }
  container.addEventListener('pointerdown', onPointerDown)
  container.addEventListener('pointermove', onPointerMove)
  container.addEventListener('pointerup', onPointerUp)
  container.addEventListener('pointercancel', onPointerUp)
  container.addEventListener('focusin', onFocusIn)
  container.addEventListener('focusout', onFocusOut)

  const resize = () => {
    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // En pantallas estrechas se aleja la cámara para que la esfera quepa.
    camera.position.z = width < 640 ? 4.6 : 3.9
    camera.updateProjectionMatrix()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  resize()

  // Solo se anima cuando la escena está en pantalla.
  let visible = true
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true
  })
  intersection.observe(container)

  const point = new Vector3()
  const placeLabels = () => {
    const { width, height } = container.getBoundingClientRect()
    group.updateMatrixWorld()
    for (const [index, element] of labels) {
      point.set(...data.nodes[index]!.position).applyMatrix4(group.matrixWorld)
      const depth = point.z
      point.project(camera)
      const x = ((point.x + 1) / 2) * width
      const y = ((1 - point.y) / 2) * height
      element.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      // Las etiquetas del lado de atrás se atenúan y quedan detrás.
      element.style.opacity = depth > -0.2 ? '1' : '0.35'
      element.style.zIndex = depth > -0.2 ? '2' : '1'
    }
  }

  let frame = 0
  const tick = () => {
    frame = requestAnimationFrame(tick)
    if (!visible || document.hidden) return
    if (!dragging && !paused) {
      group.rotation.y += velocity
      velocity += (0.0012 - velocity) * 0.02 // vuelve suavemente a la velocidad base
    }
    stars.rotation.y += 0.00025
    renderer.render(scene, camera)
    placeLabels()
  }
  tick()

  return {
    dispose() {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersection.disconnect()
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointercancel', onPointerUp)
      container.removeEventListener('focusin', onFocusIn)
      container.removeEventListener('focusout', onFocusOut)
      scene.traverse((object) => {
        if (object instanceof Points || object instanceof LineSegments) {
          object.geometry.dispose()
          ;(object.material as PointsMaterial | LineBasicMaterial).dispose()
        }
      })
      texture.dispose()
      renderer.dispose()
    },
  }
}
