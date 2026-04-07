import { useMemo } from 'react'
import { useGameStore } from '@/api/store'
import { ArmyStatus, EntityType, ResourceType } from '@/sdk'
import { RESOURCE_TYPE_MAP } from '@/utils/constants'
import './MobileMapOverlay.css'

export default function MobileMapOverlay() {
  const { armies, selectedArmyId, selectedEntity, selectedPosition, setActiveDialog } = useGameStore()

  const primaryArmy = useMemo(
    () => armies.find((army) => army.id === selectedArmyId) ?? armies[0] ?? null,
    [armies, selectedArmyId],
  )

  const armyStatusLabel =
    primaryArmy?.status === ArmyStatus.Marching
      ? '行军中'
      : primaryArmy?.status === ArmyStatus.Collecting
        ? '采集中'
        : primaryArmy?.status === ArmyStatus.Battle
          ? '战斗中'
          : primaryArmy?.status === ArmyStatus.Stationing
            ? '驻扎中'
            : primaryArmy
              ? '空闲'
              : '暂无军队'

  const targetTitle = useMemo(() => {
    if (!selectedEntity) {
      return selectedPosition ? `坐标 (${selectedPosition.x}, ${selectedPosition.y})` : '未选择目标'
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
      return selectedPosition ? '可点击底部按钮继续操作' : '点击地图或对象后查看详情'
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
    <div className="mobile-map-overlay">
      <div className="mobile-map-overlay-main">
        <div>
          <div className="mobile-map-overlay-label">当前目标</div>
          <div className="mobile-map-overlay-title">{targetTitle}</div>
          <div className="mobile-map-overlay-meta">{targetMeta}</div>
        </div>
        <button className="mobile-map-overlay-button" onClick={() => setActiveDialog('army')} type="button">
          军队
        </button>
      </div>
      <div className="mobile-map-overlay-footer">
        <span>出征军队：{primaryArmy ? `#${primaryArmy.id}` : '暂无'}</span>
        <span className={primaryArmy?.status === ArmyStatus.Idle ? 'mobile-army-status idle' : 'mobile-army-status'}>
          {armyStatusLabel}
        </span>
      </div>
    </div>
  )
}
