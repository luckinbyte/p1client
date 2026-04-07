import * as THREE from 'three'
import { CAMERA_CONFIG } from '@/utils/constants'

export class GameScene {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLElement
  private animationId = 0
  private isRunning = false
  private mapGroup: THREE.Group
  private entityGroup: THREE.Group
  private uiGroup: THREE.Group
  private readonly handleResize = () => {
    const width = this.container.clientWidth
    const height = this.container.clientHeight || 1
    const aspect = width / height
    const frustumSize = 50

    this.camera.left = (frustumSize * aspect) / -2
    this.camera.right = (frustumSize * aspect) / 2
    this.camera.top = frustumSize / 2
    this.camera.bottom = frustumSize / -2
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    const width = container.clientWidth || 1
    const height = container.clientHeight || 1
    const aspect = width / height
    const frustumSize = 50

    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000,
    )
    this.setupCamera()

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)

    this.mapGroup = new THREE.Group()
    this.entityGroup = new THREE.Group()
    this.uiGroup = new THREE.Group()
    this.scene.add(this.mapGroup)
    this.scene.add(this.entityGroup)
    this.scene.add(this.uiGroup)

    this.setupLights()
    window.addEventListener('resize', this.handleResize)
  }

  private setupCamera(): void {
    const distance = 100
    const angle = CAMERA_CONFIG.angle

    this.camera.position.set(distance * Math.cos(angle), distance * Math.sin(angle), distance * Math.cos(angle))
    this.camera.lookAt(0, 0, 0)
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    this.scene.add(directionalLight)
  }

  start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.animate()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = 0
    }
  }

  private animate = (): void => {
    if (!this.isRunning) {
      return
    }

    this.animationId = requestAnimationFrame(this.animate)
    this.renderer.render(this.scene, this.camera)
  }

  getMapGroup(): THREE.Group {
    return this.mapGroup
  }

  getEntityGroup(): THREE.Group {
    return this.entityGroup
  }

  getUiGroup(): THREE.Group {
    return this.uiGroup
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  getContainer(): HTMLElement {
    return this.container
  }

  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize)
    this.renderer.dispose()

    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
