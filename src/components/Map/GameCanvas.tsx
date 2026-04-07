import { useEffect, useMemo, useRef, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { CameraController } from '@/game/CameraController'
import { EntityRenderer } from '@/game/EntityRenderer'
import { GameScene } from '@/game/GameScene'
import { MapRenderer } from '@/game/MapRenderer'
import { SelectionManager } from '@/game/SelectionManager'
import { EntityType, ResourceType } from '@/sdk'
import { RESOURCE_TYPE_MAP } from '@/utils/constants'
import './GameCanvas.css'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<{
    scene: GameScene
    mapRenderer: MapRenderer
    cameraController: CameraController
    entityRenderer: EntityRenderer
    selectionManager: SelectionManager
    unsubscribeSelection: () => void
    unsubscribeGroundClick: () => void
  } | null>(null)
  const sceneObjects = useGameStore((state) => state.sceneObjects)
  const isConnected = useGameStore((state) => state.isConnected)
  const selectedEntity = useGameStore((state) => state.selectedEntity)
  const selectedPosition = useGameStore((state) => state.selectedPosition)
  const setSelectedEntity = useGameStore((state) => state.setSelectedEntity)
  const setSelectedPosition = useGameStore((state) => state.setSelectedPosition)
  const [moveStatus, setMoveStatus] = useState<string>('')

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return
    }

    const scene = new GameScene(containerRef.current)
    const mapRenderer = new MapRenderer(scene.getMapGroup())
    const cameraController = new CameraController(scene)
    const entityRenderer = new EntityRenderer(scene.getEntityGroup())
    const selectionManager = new SelectionManager(scene, entityRenderer)
    const unsubscribeSelection = selectionManager.onSelectionChange((entity) => {
      setSelectedEntity(entity)
      if (entity) {
        setSelectedPosition(entity.position)
      }
    })
    const unsubscribeGroundClick = selectionManager.onGroundClick((position) => {
      setSelectedPosition(position)

      if (!isConnected) {
        setMoveStatus('未连接，无法移动')
        return
      }

      setMoveStatus(`正在前往 (${position.x}, ${position.y})`)
      gameClient.api
        .move(position.x, position.y)
        .then((response) => {
          if (response.code !== 0) {
            setMoveStatus(response.message || '移动失败')
            return
          }
          setMoveStatus(`已发送移动到 (${position.x}, ${position.y})`)
        })
        .catch((error: Error) => {
          setMoveStatus(error.message || '移动失败')
        })
    })

    mapRenderer.render()
    scene.start()

    gameRef.current = {
      scene,
      mapRenderer,
      cameraController,
      entityRenderer,
      selectionManager,
      unsubscribeSelection,
      unsubscribeGroundClick,
    }

    return () => {
      if (!gameRef.current) {
        return
      }

      gameRef.current.unsubscribeSelection()
      gameRef.current.unsubscribeGroundClick()
      gameRef.current.selectionManager.dispose()
      gameRef.current.entityRenderer.dispose()
      gameRef.current.cameraController.dispose()
      gameRef.current.mapRenderer.dispose()
      gameRef.current.scene.dispose()
      gameRef.current = null
      setSelectedEntity(null)
      setSelectedPosition(null)
    }
  }, [isConnected, setSelectedEntity, setSelectedPosition])

  useEffect(() => {
    if (!gameRef.current) {
      return
    }

    const { entityRenderer, selectionManager } = gameRef.current
    entityRenderer.clear()
    entityRenderer.addEntities(sceneObjects)

    const activeEntity = selectionManager.getSelectedEntity()
    if (activeEntity && !sceneObjects.some((entity) => entity.id === activeEntity.id)) {
      selectionManager.clearSelection()
    }
  }, [sceneObjects])

  const targetTitle = useMemo(() => {
    if (!selectedEntity) {
      return selectedPosition ? `坐标 (${selectedPosition.x}, ${selectedPosition.y})` : ''
    }

    switch (selectedEntity.type) {
      case EntityType.Resource: {
        const resourceConfig = RESOURCE_TYPE_MAP[selectedEntity.resourceType ?? ResourceType.Food] ?? RESOURCE_TYPE_MAP[1]
        return `${resourceConfig.icon} ${resourceConfig.name}点 #${selectedEntity.id}`
      }
      case EntityType.City:
        return `城池 #${selectedEntity.id}`
      case EntityType.Player:
        return `玩家部队 #${selectedEntity.id}`
      case EntityType.Monster:
        return `野怪 #${selectedEntity.id}`
      case EntityType.Building:
        return `建筑 #${selectedEntity.id}`
      default:
        return `目标 #${selectedEntity.id}`
    }
  }, [selectedEntity, selectedPosition])

  const targetMeta = useMemo(() => {
    if (!selectedEntity) {
      return selectedPosition ? '地面点击目标' : ''
    }

    const positionLabel = `坐标 (${selectedEntity.position.x}, ${selectedEntity.position.y})`

    switch (selectedEntity.type) {
      case EntityType.Resource:
        return `储量 ${selectedEntity.resourceAmount ?? 0} · ${positionLabel}`
      case EntityType.City:
        return `等级 ${selectedEntity.level ?? 1} · ${positionLabel}`
      case EntityType.Player:
        return `${selectedEntity.ownerId ? `归属 ${String(selectedEntity.ownerId)} · ` : ''}${positionLabel}`
      case EntityType.Monster:
        return `等级 ${selectedEntity.level ?? 1} · ${positionLabel}`
      default:
        return positionLabel
    }
  }, [selectedEntity, selectedPosition])

  return (
    <div ref={containerRef} className="game-canvas">
      {selectedPosition && (
        <div className="map-target-indicator">
          <div className="map-target-title">{targetTitle}</div>
          {targetMeta && <div className="map-target-meta">{targetMeta}</div>}
          {moveStatus && <div className="map-target-status">{moveStatus}</div>}
        </div>
      )}
    </div>
  )
}
