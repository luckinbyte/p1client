import * as THREE from 'three'
import { EntityType, type SceneObject } from '@/sdk'
import { COLORS, MAP_CONFIG, RESOURCE_TYPE_MAP } from '@/utils/constants'
import { gameToThree } from '@/utils/helpers'

interface EntityObject extends THREE.Group {
  userData: {
    entityId: number
    entityType: EntityType
    entityData: SceneObject
    label?: THREE.Sprite
  }
}

export class EntityRenderer {
  private entityGroup: THREE.Group
  private entities = new Map<number, EntityObject>()

  constructor(entityGroup: THREE.Group) {
    this.entityGroup = entityGroup
  }

  addEntity(entity: SceneObject): EntityObject {
    this.removeEntity(entity.id)

    const object = new THREE.Group() as EntityObject
    const body = this.createEntityBody(entity)
    const label = this.createLabel(entity)
    const pos = gameToThree(entity.position, MAP_CONFIG.width, MAP_CONFIG.height)

    object.add(body)
    if (label) {
      object.add(label)
    }

    object.position.set(pos.x, pos.y, pos.z)
    object.userData = {
      entityId: entity.id,
      entityType: entity.type,
      entityData: entity,
      label: label ?? undefined,
    }

    this.entities.set(entity.id, object)
    this.entityGroup.add(object)
    return object
  }

  addEntities(entities: SceneObject[]): void {
    entities.forEach((entity) => this.addEntity(entity))
  }

  private createEntityBody(entity: SceneObject): THREE.Object3D {
    switch (entity.type) {
      case EntityType.Resource:
        return this.createResourceMesh(entity)
      case EntityType.City:
        return this.createCityMesh(entity)
      case EntityType.Player:
        return this.createPlayerMesh(entity)
      case EntityType.Monster:
        return this.createMonsterMesh()
      case EntityType.Building:
        return this.createBuildingMesh()
      default:
        return this.createDefaultMesh()
    }
  }

  private createResourceMesh(entity: SceneObject): THREE.Mesh {
    const resourceConfig = RESOURCE_TYPE_MAP[entity.resourceType ?? 1] ?? RESOURCE_TYPE_MAP[1]
    const geometry = new THREE.CylinderGeometry(0.45, 0.6, 1.2, 6)
    const material = new THREE.MeshLambertMaterial({ color: resourceConfig.color })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = 0.6
    return mesh
  }

  private createCityMesh(entity: SceneObject): THREE.Group {
    const group = new THREE.Group()
    const size = Math.max(2, (entity.level ?? 1) * 0.35 + 1.4)

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(size, 0.5, size),
      new THREE.MeshLambertMaterial({ color: 0x8b7355 }),
    )
    base.position.y = 0.25
    group.add(base)

    const keep = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.45, 1.8, size * 0.45),
      new THREE.MeshLambertMaterial({ color: 0xbfa27a }),
    )
    keep.position.y = 1.15
    group.add(keep)

    const towerOffsets = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const

    towerOffsets.forEach(([x, z]) => {
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.28, 1.7, 8),
        new THREE.MeshLambertMaterial({ color: 0x6b5344 }),
      )
      tower.position.set((size / 2 - 0.25) * x, 1.1, (size / 2 - 0.25) * z)
      group.add(tower)
    })

    return group
  }

  private createPlayerMesh(entity: SceneObject): THREE.Group {
    const group = new THREE.Group()
    const color = entity.ownerId ? COLORS.friendly : COLORS.neutral

    const marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.2, 5),
      new THREE.MeshLambertMaterial({ color }),
    )
    marker.position.y = 0.6
    marker.rotation.y = Math.PI / 4
    group.add(marker)

    const base = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 }),
    )
    base.rotation.x = -Math.PI / 2
    base.position.y = 0.02
    group.add(base)

    return group
  }

  private createMonsterMesh(): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.6),
      new THREE.MeshLambertMaterial({ color: COLORS.enemy }),
    )
    mesh.position.y = 0.7
    return mesh
  }

  private createBuildingMesh(): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x64748b }),
    )
    mesh.position.y = 0.5
    return mesh
  }

  private createDefaultMesh(): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 16),
      new THREE.MeshLambertMaterial({ color: COLORS.neutral }),
    )
    mesh.position.y = 0.45
    return mesh
  }

  private createLabel(entity: SceneObject): THREE.Sprite | null {
    const text = this.getEntityLabel(entity)
    if (!text) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const context = canvas.getContext('2d')

    if (!context) {
      return null
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = 'rgba(15, 23, 42, 0.85)'
    context.roundRect(0, 8, canvas.width, 48, 12)
    context.fill()
    context.font = '24px sans-serif'
    context.fillStyle = '#e2e8f0'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(0, 2.6, 0)
    sprite.scale.set(3.5, 0.875, 1)
    return sprite
  }

  private getEntityLabel(entity: SceneObject): string | null {
    switch (entity.type) {
      case EntityType.Resource: {
        const config = RESOURCE_TYPE_MAP[entity.resourceType ?? 1] ?? RESOURCE_TYPE_MAP[1]
        const amount = entity.resourceAmount ?? 0
        return `${config.icon} ${amount}`
      }
      case EntityType.City:
        return `城池 Lv.${entity.level ?? 1}`
      case EntityType.Player:
        return '玩家部队'
      case EntityType.Monster:
        return '野怪'
      case EntityType.Building:
        return '建筑'
      default:
        return null
    }
  }

  removeEntity(entityId: number): void {
    const object = this.entities.get(entityId)
    if (!object) {
      return
    }

    this.entityGroup.remove(object)
    this.disposeObject(object)
    this.entities.delete(entityId)
  }

  updateEntity(entity: SceneObject): void {
    const existing = this.entities.get(entity.id)
    if (!existing) {
      this.addEntity(entity)
      return
    }

    existing.userData.entityData = entity
    const pos = gameToThree(entity.position, MAP_CONFIG.width, MAP_CONFIG.height)
    existing.position.set(pos.x, pos.y, pos.z)

    if (existing.userData.label) {
      existing.remove(existing.userData.label)
      this.disposeObject(existing.userData.label)
    }

    const nextLabel = this.createLabel(entity)
    if (nextLabel) {
      existing.add(nextLabel)
    }
    existing.userData.label = nextLabel ?? undefined
  }

  updateEntityPosition(entityId: number, position: { x: number; y: number }): void {
    const object = this.entities.get(entityId)
    if (!object) {
      return
    }

    const pos = gameToThree(position, MAP_CONFIG.width, MAP_CONFIG.height)
    object.position.set(pos.x, pos.y, pos.z)
  }

  getEntity(entityId: number): EntityObject | undefined {
    return this.entities.get(entityId)
  }

  getAllEntities(): Map<number, EntityObject> {
    return this.entities
  }

  highlightEntity(entityId: number, highlight: boolean): void {
    const object = this.entities.get(entityId)
    if (!object) {
      return
    }

    object.scale.setScalar(highlight ? 1.15 : 1)

    object.traverse((child) => {
      if (child instanceof THREE.Mesh && 'emissive' in child.material) {
        const material = child.material as THREE.MeshLambertMaterial
        material.emissive.setHex(highlight ? COLORS.selection : 0x000000)
        material.emissiveIntensity = highlight ? 0.35 : 0
      }
    })
  }

  clear(): void {
    Array.from(this.entities.keys()).forEach((id) => this.removeEntity(id))
  }

  dispose(): void {
    this.clear()
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose())
        } else {
          child.material.dispose()
        }
      }

      if (child instanceof THREE.Sprite) {
        child.material.map?.dispose()
        child.material.dispose()
      }
    })
  }
}
