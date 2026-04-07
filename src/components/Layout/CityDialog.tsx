import { useMemo } from 'react'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { EntityType } from '@/sdk'
import './CityDialog.css'

export default function CityDialog() {
  const { activeDialog, setActiveDialog, sceneObjects, selectedEntity, addEventLog } = useGameStore()

  const cityObjects = useMemo(
    () => sceneObjects.filter((object) => object.type === EntityType.City || object.type === EntityType.Building),
    [sceneObjects],
  )

  const focusObject =
    selectedEntity?.type === EntityType.City || selectedEntity?.type === EntityType.Building ? selectedEntity : cityObjects[0] ?? null

  const title = focusObject?.type === EntityType.City ? `城池 #${focusObject.id}` : focusObject ? `建筑 #${focusObject.id}` : '暂无城建目标'

  const detail = useMemo(() => {
    if (!focusObject) {
      return '当前场景中没有可查看的城池或建筑对象'
    }

    const positionLabel = `坐标 (${focusObject.position.x}, ${focusObject.position.y})`
    const levelLabel = `等级 ${focusObject.level ?? 1}`

    if (focusObject.type === EntityType.City) {
      return `${levelLabel} · ${positionLabel}${focusObject.ownerId ? ` · 归属 ${String(focusObject.ownerId)}` : ''}`
    }

    return `${positionLabel}${focusObject.ownerId ? ` · 归属 ${String(focusObject.ownerId)}` : ''}`
  }, [focusObject])

  return (
    <Modal isOpen={activeDialog === 'city'} onClose={() => setActiveDialog(null)} title="城池与建筑">
      <div className="city-dialog">
        <div className="city-dialog-summary">
          <div>
            <h3>{title}</h3>
            <div className="city-dialog-detail">{detail}</div>
          </div>
          {focusObject && (
            <Button
              onClick={() => {
                addEventLog(`查看城建目标：#${focusObject.id}`)
                setActiveDialog(null)
              }}
              size="small"
              variant="secondary"
            >
              关闭
            </Button>
          )}
        </div>

        <div className="city-dialog-card-grid">
          <div className="city-dialog-card">
            <div className="city-dialog-card-label">当前场景城池</div>
            <strong>{sceneObjects.filter((object) => object.type === EntityType.City).length}</strong>
          </div>
          <div className="city-dialog-card">
            <div className="city-dialog-card-label">当前场景建筑</div>
            <strong>{sceneObjects.filter((object) => object.type === EntityType.Building).length}</strong>
          </div>
        </div>

        <div className="city-dialog-section">
          <div className="city-dialog-section-title">可展示信息</div>
          <ul className="city-dialog-list">
            <li>对象类型：城池 / 建筑</li>
            <li>对象 ID、坐标、等级、归属</li>
            <li>仅基于 SDK 已支持的场景对象协议展示</li>
          </ul>
        </div>

        <div className="city-dialog-section">
          <div className="city-dialog-section-title">当前限制</div>
          <div className="city-dialog-note">SDK 暂未提供建筑建造、升级、队列等独立协议，因此前端暂不实现建造操作。</div>
        </div>
      </div>
    </Modal>
  )
}
