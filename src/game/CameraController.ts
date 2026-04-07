import * as THREE from 'three'
import { GameScene } from './GameScene'
import { CAMERA_CONFIG, MAP_CONFIG } from '@/utils/constants'
import { clamp } from '@/utils/helpers'

export class CameraController {
  private camera: THREE.OrthographicCamera
  private container: HTMLElement
  private zoom: number = CAMERA_CONFIG.defaultZoom
  private targetPosition = new THREE.Vector3(0, 0, 0)
  private isDragging = false
  private lastPointer = { x: 0, y: 0 }
  private touchStartDistance = 0
  private lastTouchCenter = { x: 0, y: 0 }

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) {
      return
    }

    this.isDragging = true
    this.lastPointer = { x: event.clientX, y: event.clientY }
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) {
      return
    }

    this.panByDelta(event.clientX - this.lastPointer.x, event.clientY - this.lastPointer.y, 0.5)
    this.lastPointer = { x: event.clientX, y: event.clientY }
  }

  private readonly handleMouseUp = (): void => {
    this.isDragging = false
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault()
    const zoomDelta = event.deltaY > 0 ? 0.1 : -0.1
    this.setZoom(this.zoom + zoomDelta)
  }

  private readonly handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault()

    if (event.touches.length === 1) {
      this.isDragging = true
      this.lastPointer = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }
      return
    }

    if (event.touches.length === 2) {
      this.isDragging = false
      this.touchStartDistance = this.getTouchDistance(event.touches)
      this.lastTouchCenter = this.getTouchCenter(event.touches)
    }
  }

  private readonly handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault()

    if (event.touches.length === 1 && this.isDragging) {
      this.panByDelta(
        event.touches[0].clientX - this.lastPointer.x,
        event.touches[0].clientY - this.lastPointer.y,
        0.5,
      )
      this.lastPointer = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }
      return
    }

    if (event.touches.length !== 2) {
      return
    }

    const currentDistance = this.getTouchDistance(event.touches)
    if (this.touchStartDistance > 0) {
      this.setZoom(this.zoom / (currentDistance / this.touchStartDistance))
    }
    this.touchStartDistance = currentDistance

    const currentCenter = this.getTouchCenter(event.touches)
    this.panByDelta(currentCenter.x - this.lastTouchCenter.x, currentCenter.y - this.lastTouchCenter.y, 0.3)
    this.lastTouchCenter = currentCenter
  }

  private readonly handleTouchEnd = (event: TouchEvent): void => {
    this.isDragging = false

    if (event.touches.length === 2) {
      this.touchStartDistance = this.getTouchDistance(event.touches)
      this.lastTouchCenter = this.getTouchCenter(event.touches)
      return
    }

    if (event.touches.length === 1) {
      this.isDragging = true
      this.lastPointer = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }
      return
    }

    this.touchStartDistance = 0
  }

  constructor(gameScene: GameScene) {
    this.camera = gameScene.getCamera()
    this.container = gameScene.getContainer()
    this.setZoom(this.zoom)
    this.updateCameraPosition()
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.container.addEventListener('mousedown', this.handleMouseDown)
    window.addEventListener('mousemove', this.handleMouseMove)
    window.addEventListener('mouseup', this.handleMouseUp)
    this.container.addEventListener('wheel', this.handleWheel, { passive: false })
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.container.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    this.container.addEventListener('touchcancel', this.handleTouchEnd, { passive: false })
  }

  private panByDelta(deltaX: number, deltaY: number, moveSpeedFactor: number): void {
    const moveSpeed = moveSpeedFactor / this.zoom
    const angle = CAMERA_CONFIG.angle

    this.targetPosition.x -= deltaX * moveSpeed * Math.cos(angle) + deltaY * moveSpeed * Math.sin(angle)
    this.targetPosition.z -= -deltaX * moveSpeed * Math.sin(angle) + deltaY * moveSpeed * Math.cos(angle)

    this.clampPosition()
    this.updateCameraPosition()
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  private getTouchCenter(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }

  private clampPosition(): void {
    const halfWidth = (MAP_CONFIG.width * MAP_CONFIG.tileSize) / 2
    const halfHeight = (MAP_CONFIG.height * MAP_CONFIG.tileSize) / 2

    this.targetPosition.x = clamp(this.targetPosition.x, -halfWidth, halfWidth)
    this.targetPosition.z = clamp(this.targetPosition.z, -halfHeight, halfHeight)
  }

  private updateCameraPosition(): void {
    const distance = 100
    const angle = CAMERA_CONFIG.angle

    this.camera.position.set(
      this.targetPosition.x + distance * Math.cos(angle),
      distance * Math.sin(angle),
      this.targetPosition.z + distance * Math.cos(angle),
    )
    this.camera.lookAt(this.targetPosition)
  }

  setZoom(zoom: number): void {
    this.zoom = clamp(zoom, CAMERA_CONFIG.minZoom, CAMERA_CONFIG.maxZoom)
    this.camera.zoom = this.zoom
    this.camera.updateProjectionMatrix()
  }

  getZoom(): number {
    return this.zoom
  }

  focusOn(x: number, z: number): void {
    this.targetPosition.set(x, 0, z)
    this.clampPosition()
    this.updateCameraPosition()
  }

  getCenterGamePosition(): { x: number; y: number } {
    return {
      x: Math.floor(this.targetPosition.x + MAP_CONFIG.width / 2),
      y: Math.floor(this.targetPosition.z + MAP_CONFIG.height / 2),
    }
  }

  dispose(): void {
    this.container.removeEventListener('mousedown', this.handleMouseDown)
    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('mouseup', this.handleMouseUp)
    this.container.removeEventListener('wheel', this.handleWheel)
    this.container.removeEventListener('touchstart', this.handleTouchStart)
    this.container.removeEventListener('touchmove', this.handleTouchMove)
    this.container.removeEventListener('touchend', this.handleTouchEnd)
    this.container.removeEventListener('touchcancel', this.handleTouchEnd)
  }
}
