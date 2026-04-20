import * as THREE from 'three'
import { COLORS, MAP_CONFIG } from '@/utils/constants'
import { gameToThree } from '@/utils/helpers'
import type { Position } from '@/sdk'

export class MarchPathRenderer {
  private uiGroup: THREE.Group
  private paths = new Map<number, THREE.Line>()

  constructor(uiGroup: THREE.Group) {
    this.uiGroup = uiGroup
  }

  createPath(armyId: number, fromPos: Position, toPos: Position): void {
    this.removePath(armyId)

    const from = gameToThree(fromPos, MAP_CONFIG.width, MAP_CONFIG.height)
    const to = gameToThree(toPos, MAP_CONFIG.width, MAP_CONFIG.height)

    const points = [
      new THREE.Vector3(from.x, 0.5, from.z),
      new THREE.Vector3(to.x, 0.5, to.z),
    ]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: COLORS.marchPath,
      transparent: true,
      opacity: 0.7,
    })
    const line = new THREE.Line(geometry, material)
    this.paths.set(armyId, line)
    this.uiGroup.add(line)
  }

  removePath(armyId: number): void {
    const existing = this.paths.get(armyId)
    if (!existing) return
    this.uiGroup.remove(existing)
    existing.geometry.dispose()
    ;(existing.material as THREE.Material).dispose()
    this.paths.delete(armyId)
  }

  clear(): void {
    Array.from(this.paths.keys()).forEach((id) => this.removePath(id))
  }

  dispose(): void {
    this.clear()
  }
}
