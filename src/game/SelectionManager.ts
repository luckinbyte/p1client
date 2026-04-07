import * as THREE from 'three'
import type { SceneObject } from '@/sdk'
import { GameScene } from './GameScene'
import { EntityRenderer } from './EntityRenderer'
import { MAP_CONFIG } from '@/utils/constants'
import { threeToGame } from '@/utils/helpers'

type SelectionCallback = (entity: SceneObject | null) => void
type GroundClickCallback = (position: { x: number; y: number }) => void

export class SelectionManager {
  private renderer: THREE.WebGLRenderer
  private camera: THREE.Camera
  private container: HTMLElement
  private entityRenderer: EntityRenderer
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private selectedEntityId: number | null = null
  private selectionCallbacks: SelectionCallback[] = []
  private groundClickCallbacks: GroundClickCallback[] = []

  private readonly handleClick = (event: MouseEvent): void => {
    const target = this.pickEntity(event)

    if (!target) {
      this.clearSelection()
      const position = this.getClickGamePosition(event)
      if (position) {
        this.groundClickCallbacks.forEach((callback) => callback(position))
      }
      return
    }

    this.selectEntity(target.userData.entityId)
  }

  constructor(gameScene: GameScene, entityRenderer: EntityRenderer) {
    this.renderer = gameScene.getRenderer()
    this.camera = gameScene.getCamera()
    this.container = gameScene.getContainer()
    this.entityRenderer = entityRenderer
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', this.handleClick)
  }

  private updatePointer(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  private pickEntity(event: MouseEvent): THREE.Object3D | null {
    this.updatePointer(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const targets = Array.from(this.entityRenderer.getAllEntities().values())
    const intersections = this.raycaster.intersectObjects(targets, true)

    for (const intersection of intersections) {
      let current: THREE.Object3D | null = intersection.object

      while (current && !current.userData?.entityId) {
        current = current.parent
      }

      if (current?.userData?.entityId) {
        return current
      }
    }

    return null
  }

  selectEntity(entityId: number): void {
    if (this.selectedEntityId === entityId) {
      return
    }

    if (this.selectedEntityId !== null) {
      this.entityRenderer.highlightEntity(this.selectedEntityId, false)
    }

    this.selectedEntityId = entityId
    this.entityRenderer.highlightEntity(entityId, true)

    const entity = this.entityRenderer.getEntity(entityId)?.userData.entityData ?? null
    this.selectionCallbacks.forEach((callback) => callback(entity))
  }

  clearSelection(): void {
    if (this.selectedEntityId !== null) {
      this.entityRenderer.highlightEntity(this.selectedEntityId, false)
      this.selectedEntityId = null
    }

    this.selectionCallbacks.forEach((callback) => callback(null))
  }

  getSelectedEntity(): SceneObject | null {
    if (this.selectedEntityId === null) {
      return null
    }

    return this.entityRenderer.getEntity(this.selectedEntityId)?.userData.entityData ?? null
  }

  onSelectionChange(callback: SelectionCallback): () => void {
    this.selectionCallbacks.push(callback)

    return () => {
      this.selectionCallbacks = this.selectionCallbacks.filter((item) => item !== callback)
    }
  }

  onGroundClick(callback: GroundClickCallback): () => void {
    this.groundClickCallbacks.push(callback)

    return () => {
      this.groundClickCallbacks = this.groundClickCallbacks.filter((item) => item !== callback)
    }
  }

  getClickGamePosition(event: MouseEvent): { x: number; y: number } | null {
    this.updatePointer(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersection = new THREE.Vector3()

    if (!this.raycaster.ray.intersectPlane(plane, intersection)) {
      return null
    }

    return threeToGame(intersection.x, intersection.z, MAP_CONFIG.width, MAP_CONFIG.height)
  }

  dispose(): void {
    this.container.removeEventListener('click', this.handleClick)
    this.selectionCallbacks = []
    this.groundClickCallbacks = []
  }
}
