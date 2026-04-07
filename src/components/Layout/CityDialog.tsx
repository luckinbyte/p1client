import { useEffect, useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { EntityType, type BuildQueueItem, type BuildingData, type CityData, type Resources, type RoleInfo } from '@/sdk'
import './CityDialog.css'

export default function CityDialog() {
  const { activeDialog, setActiveDialog, sceneObjects, selectedEntity, addEventLog, updateResources } = useGameStore()
  const [cityInfo, setCityInfo] = useState<CityData | null>(null)
  const [buildQueue, setBuildQueue] = useState<BuildQueueItem[]>([])
  const [completedQueue, setCompletedQueue] = useState<BuildQueueItem[]>([])
  const [production, setProduction] = useState<Resources | null>(null)
  const [loading, setLoading] = useState(false)
  const [upgradingType, setUpgradingType] = useState<number | null>(null)
  const [cancelingQueueId, setCancelingQueueId] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState('')

  const cityObjects = useMemo(
    () => sceneObjects.filter((object) => object.type === EntityType.City || object.type === EntityType.Building),
    [sceneObjects],
  )

  const focusObject =
    selectedEntity?.type === EntityType.City || selectedEntity?.type === EntityType.Building ? selectedEntity : cityObjects[0] ?? null

  const syncRoleResources = async () => {
    const roleResponse = await gameClient.api.getRoleInfo()
    if (roleResponse.code === 0 && roleResponse.data) {
      updateResources((roleResponse.data as RoleInfo).resources)
    }
  }

  const loadCityData = async () => {
    setLoading(true)
    setActionStatus('')

    try {
      const [cityResponse, queueResponse, productionResponse] = await Promise.all([
        gameClient.api.getCityInfo(),
        gameClient.api.getBuildQueue(),
        gameClient.api.getCityProduction(),
      ])

      if (cityResponse.code !== 0) {
        setActionStatus(cityResponse.message || '读取城池信息失败')
        return
      }
      if (queueResponse.code !== 0) {
        setActionStatus(queueResponse.message || '读取建造队列失败')
        return
      }
      if (productionResponse.code !== 0) {
        setActionStatus(productionResponse.message || '读取城池产出失败')
        return
      }

      const nextCity = cityResponse.data?.city ?? null
      const nextCompleted = cityResponse.data?.completed ?? []
      const nextQueue = queueResponse.data?.queue ?? []
      const nextQueueCompleted = queueResponse.data?.completed ?? []
      const nextProduction = productionResponse.data ?? null

      setCityInfo(nextCity)
      setBuildQueue(nextQueue)
      setCompletedQueue([...nextCompleted, ...nextQueueCompleted])
      setProduction(nextProduction)
      setActionStatus('已刷新城池信息')
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '读取城池信息失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeDialog === 'city') {
      void loadCityData()
    }
  }, [activeDialog])

  const title = cityInfo ? `城池 #${cityInfo.cityId}` : focusObject?.type === EntityType.City ? `城池 #${focusObject.id}` : '城池与建筑'

  const detail = useMemo(() => {
    if (cityInfo) {
      return `坐标 (${cityInfo.position.x}, ${cityInfo.position.y}) · 建筑 ${Object.keys(cityInfo.buildings).length} 个`
    }

    if (!focusObject) {
      return '当前场景中没有可查看的城池或建筑对象'
    }

    const positionLabel = `坐标 (${focusObject.position.x}, ${focusObject.position.y})`
    const levelLabel = `等级 ${focusObject.level ?? 1}`

    if (focusObject.type === EntityType.City) {
      return `${levelLabel} · ${positionLabel}${focusObject.ownerId ? ` · 归属 ${String(focusObject.ownerId)}` : ''}`
    }

    return `${positionLabel}${focusObject.ownerId ? ` · 归属 ${String(focusObject.ownerId)}` : ''}`
  }, [cityInfo, focusObject])

  const buildingList = useMemo(() => Object.values(cityInfo?.buildings ?? {}) as BuildingData[], [cityInfo])

  const handleUpgradeBuilding = async (buildingType: number) => {
    setUpgradingType(buildingType)
    setActionStatus('')

    try {
      const response = await gameClient.api.upgradeBuilding(buildingType)
      if (response.code !== 0) {
        setActionStatus(response.message || '升级建筑失败')
        return
      }

      await Promise.all([loadCityData(), syncRoleResources()])
      addEventLog(`已发起建筑升级 type=${buildingType}`)
      setActionStatus(`已加入建筑升级队列 type=${buildingType}`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '升级建筑失败')
    } finally {
      setUpgradingType(null)
    }
  }

  const handleCancelBuild = async (queueId: number) => {
    setCancelingQueueId(queueId)
    setActionStatus('')

    try {
      const response = await gameClient.api.cancelBuild(queueId)
      if (response.code !== 0) {
        setActionStatus(response.message || '取消建造失败')
        return
      }

      await Promise.all([loadCityData(), syncRoleResources()])
      addEventLog(`已取消建造队列 #${queueId}`)
      setActionStatus(`已取消建造队列 #${queueId}`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '取消建造失败')
    } finally {
      setCancelingQueueId(null)
    }
  }

  return (
    <Modal isOpen={activeDialog === 'city'} onClose={() => setActiveDialog(null)} title="城池与建筑">
      <div className="city-dialog">
        <div className="city-dialog-summary">
          <div>
            <h3>{title}</h3>
            <div className="city-dialog-detail">{detail}</div>
          </div>
          <div className="city-dialog-actions">
            <Button onClick={() => void loadCityData()} size="small" variant="secondary">
              {loading ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={() => setActiveDialog(null)} size="small" variant="secondary">
              关闭
            </Button>
          </div>
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
          <div className="city-dialog-card">
            <div className="city-dialog-card-label">城内建筑</div>
            <strong>{buildingList.length}</strong>
          </div>
          <div className="city-dialog-card">
            <div className="city-dialog-card-label">建造队列</div>
            <strong>{buildQueue.length}</strong>
          </div>
        </div>

        {production && (
          <div className="city-dialog-section">
            <div className="city-dialog-section-title">资源产出</div>
            <div className="city-dialog-card-grid city-dialog-production-grid">
              <div className="city-dialog-card">
                <div className="city-dialog-card-label">粮食</div>
                <strong>{production.food}</strong>
              </div>
              <div className="city-dialog-card">
                <div className="city-dialog-card-label">木材</div>
                <strong>{production.wood}</strong>
              </div>
              <div className="city-dialog-card">
                <div className="city-dialog-card-label">石料</div>
                <strong>{production.stone}</strong>
              </div>
              <div className="city-dialog-card">
                <div className="city-dialog-card-label">黄金</div>
                <strong>{production.gold}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="city-dialog-section">
          <div className="city-dialog-section-title">建筑列表</div>
          {buildingList.length === 0 ? (
            <div className="city-dialog-note">当前暂无建筑数据</div>
          ) : (
            <div className="city-dialog-building-list">
              {buildingList.map((building) => (
                <div key={building.entityId} className="city-dialog-row-card">
                  <div>
                    <div className="city-dialog-row-title">建筑类型 {building.type}</div>
                    <div className="city-dialog-row-meta">等级 {building.level} · HP {building.hp} · 实体 {building.entityId}</div>
                  </div>
                  <Button
                    disabled={upgradingType === building.type}
                    onClick={() => void handleUpgradeBuilding(building.type)}
                    size="small"
                    variant="secondary"
                  >
                    {upgradingType === building.type ? '升级中...' : '升级'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="city-dialog-section">
          <div className="city-dialog-section-title">建造队列</div>
          {buildQueue.length === 0 ? (
            <div className="city-dialog-note">当前没有建造队列</div>
          ) : (
            <div className="city-dialog-building-list">
              {buildQueue.map((item) => (
                <div key={item.id} className="city-dialog-row-card">
                  <div>
                    <div className="city-dialog-row-title">队列 #{item.id}</div>
                    <div className="city-dialog-row-meta">
                      建筑类型 {item.buildingType} · 目标等级 {item.targetLevel} · 完成时间 {new Date(item.finishTime).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    disabled={cancelingQueueId === item.id}
                    onClick={() => void handleCancelBuild(item.id)}
                    size="small"
                    variant="secondary"
                  >
                    {cancelingQueueId === item.id ? '处理中...' : '取消'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {completedQueue.length > 0 && (
          <div className="city-dialog-section">
            <div className="city-dialog-section-title">最近完成</div>
            <div className="city-dialog-building-list">
              {completedQueue.map((item) => (
                <div key={`completed-${item.id}-${item.finishTime}`} className="city-dialog-row-card city-dialog-row-card-static">
                  <div>
                    <div className="city-dialog-row-title">队列 #{item.id}</div>
                    <div className="city-dialog-row-meta">建筑类型 {item.buildingType} · 目标等级 {item.targetLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="city-dialog-section">
          <div className="city-dialog-section-title">当前范围</div>
          <div className="city-dialog-note">当前城建面板仅实现 SDK 已支持的城池信息、建筑升级、建造队列、取消建造、资源产出能力。</div>
        </div>

        {actionStatus && <div className="city-dialog-status">{actionStatus}</div>}
      </div>
    </Modal>
  )
}
