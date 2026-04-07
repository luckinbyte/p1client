import * as THREE from 'three'
import { COLORS, MAP_CONFIG } from '@/utils/constants'

export class MapRenderer {
  private mapGroup: THREE.Group
  private gridHelper: THREE.GridHelper | null = null
  private groundMesh: THREE.Mesh | null = null

  constructor(mapGroup: THREE.Group) {
    this.mapGroup = mapGroup
  }

  render(): void {
    this.dispose()
    this.renderGround()
    this.renderGrid()
  }

  private renderGround(): void {
    const { width, height, tileSize } = MAP_CONFIG
    const geometry = new THREE.PlaneGeometry(width * tileSize, height * tileSize)
    const material = new THREE.MeshLambertMaterial({
      color: COLORS.grass,
      side: THREE.DoubleSide,
    })

    this.groundMesh = new THREE.Mesh(geometry, material)
    this.groundMesh.rotation.x = -Math.PI / 2
    this.groundMesh.position.set(0, -0.01, 0)
    this.groundMesh.receiveShadow = true
    this.mapGroup.add(this.groundMesh)
  }

  private renderGrid(): void {
    const { width, height, tileSize } = MAP_CONFIG
    const size = Math.max(width, height) * tileSize

    this.gridHelper = new THREE.GridHelper(size, size, 0x2a2a2a, 0x1a1a1a)
    this.gridHelper.position.set(0, 0, 0)
    this.mapGroup.add(this.gridHelper)
  }

  showAreaIndicator(x: number, y: number, radius: number = 5): THREE.Mesh {
    const geometry = new THREE.RingGeometry(Math.max(radius - 0.1, 0.1), radius, 32)
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.selection,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })

    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x - MAP_CONFIG.width / 2, 0.01, y - MAP_CONFIG.height / 2)
    this.mapGroup.add(ring)

    return ring
  }

  removeIndicator(mesh: THREE.Object3D): void {
    this.mapGroup.remove(mesh)

    if (mesh instanceof THREE.Mesh) {
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose())
      } else {
        mesh.material.dispose()
      }
    }
  }

  dispose(): void {
    if (this.gridHelper) {
      this.mapGroup.remove(this.gridHelper)
      this.gridHelper.geometry.dispose()
      if (Array.isArray(this.gridHelper.material)) {
        this.gridHelper.material.forEach((material) => material.dispose())
      } else {
        this.gridHelper.material.dispose()
      }
      this.gridHelper = null
    }

    if (this.groundMesh) {
      this.mapGroup.remove(this.groundMesh)
      this.groundMesh.geometry.dispose()
      if (Array.isArray(this.groundMesh.material)) {
        this.groundMesh.material.forEach((material) => material.dispose())
      } else {
        this.groundMesh.material.dispose()
      }
      this.groundMesh = null
    }
  }
}
