import { useEffect, useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { EntityType, type BuildQueueItem, type CityData, type Resources, type RoleInfo } from '@/sdk'
import './CityDialog.css'

/** Building type to Chinese name mapping */
const BUILDING_NAMES: Record<number, string> = {
  1: '城堡',
  2: '兵营',
  3: '农场',
  4: '伐木场',
  5: '采石场',
  6: '医院',
  7: '仓库',
}

/** All 7 building types that should always be displayed */
const ALL_BUILDING_TYPES = [1, 2, 3, 4, 5, 6, 7]

/** Building costs by type -> level -> cost */
const BUILDING_COSTS: Record<number, Record<number, { food: number; wood: number; stone: number; gold: number; buildTime: number }>> = {
  1: { 1: { food: 0, wood: 0, stone: 0, gold: 0, buildTime: 0 }, 2: { food: 500, wood: 1000, stone: 500, gold: 100, buildTime: 3600 }, 3: { food: 1200, wood: 1800, stone: 1000, gold: 250, buildTime: 7200 } },
  2: { 1: { food: 100, wood: 200, stone: 100, gold: 0, buildTime: 300 }, 2: { food: 300, wood: 400, stone: 250, gold: 50, buildTime: 900 } },
  3: { 1: { food: 50, wood: 100, stone: 50, gold: 0, buildTime: 180 }, 2: { food: 120, wood: 220, stone: 100, gold: 20, buildTime: 480 } },
  4: { 1: { food: 50, wood: 80, stone: 50, gold: 0, buildTime: 180 }, 2: { food: 120, wood: 180, stone: 100, gold: 20, buildTime: 480 } },
  5: { 1: { food: 80, wood: 100, stone: 80, gold: 0, buildTime: 240 }, 2: { food: 180, wood: 220, stone: 180, gold: 30, buildTime: 600 } },
  6: { 1: { food: 120, wood: 150, stone: 120, gold: 20, buildTime: 360 } },
  7: { 1: { food: 100, wood: 200, stone: 150, gold: 20, buildTime: 360 } },
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '已完成'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export default function CityDialog() {
  const { activeDialog, setActiveDialog, sceneObjects, selectedEntity, addEventLog, updateResources } = useGameStore()
  const roleInfo = useGameStore((state) => state.roleInfo)
  const resources = roleInfo?.resources
  const [cityInfo, setCityInfo] = useState<CityData | null>(null)
  const [buildQueue, setBuildQueue] = useState<BuildQueueItem[]>([])
  const [completedQueue, setCompletedQueue] = useState<BuildQueueItem[]>([])
  const [production, setProduction] = useState<Resources | null>(null)
  const [loading, setLoading] = useState(false)
  const [upgradingType, setUpgradingType] = useState<number | null>(null)
  const [cancelingQueueId, setCancelingQueueId] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState('')
  const [confirmModal, setConfirmModal] = useState<{ buildingType: number; targetLevel: number; cost: { food: number; wood: number; stone: number; gold: number; buildTime: number } } | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))

  const cityObjects = useMemo(
    () => sceneObjects.filter((object) => object.type === EntityType.City || object.type === EntityType.Building),
    [sceneObjects],
  )

  const focusObject =
    selectedEntity?.type === EntityType.City || selectedEntity?.type === EntityType.Building ? selectedEntity : cityObjects[0] ?? null

  const isQueueActive = buildQueue.length > 0

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

  // Countdown timer tick
  useEffect(() => {
    if (activeDialog !== 'city') return
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(timer)
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
            <div className="city-dialog-card-label">城内建筑</div>
            <strong>{Object.keys(cityInfo?.buildings ?? {}).length}</strong>
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
          <div className="city-dialog-building-list">
            {ALL_BUILDING_TYPES.map((type) => {
              const building = cityInfo?.buildings[type]
              const name = BUILDING_NAMES[type] ?? `建筑 ${type}`
              const isBuilt = building != null
              const currentLevel = isBuilt ? building.level : 0
              const targetLevel = currentLevel + 1
              const cost = BUILDING_COSTS[type]?.[targetLevel]
              const isSubmitting = upgradingType === type

              const handleUpgradeClick = () => {
                setInlineError(null)
                if (!cost) return

                if (resources && (
                  resources.food < cost.food ||
                  resources.wood < cost.wood ||
                  resources.stone < cost.stone ||
                  resources.gold < cost.gold
                )) {
                  setInlineError('资源不足')
                  return
                }

                if (isQueueActive) {
                  setInlineError('建造队列已满')
                  return
                }

                setConfirmModal({ buildingType: type, targetLevel, cost })
              }

              return (
                <div key={type} className={`city-dialog-row-card${!isBuilt ? ' city-dialog-row-card-unbuilt' : ''}`}>
                  <div>
                    <div className="city-dialog-row-title">
                      {name}
                      {!isBuilt && <span className="city-dialog-unbuilt-badge">未建造</span>}
                    </div>
                    <div className="city-dialog-row-meta">
                      {isBuilt
                        ? `等级 ${currentLevel} · HP ${building.hp}`
                        : '尚未建造'
                      }
                    </div>
                  </div>
                  <Button
                    disabled={isSubmitting || isQueueActive}
                    onClick={handleUpgradeClick}
                    size="small"
                    variant={isBuilt ? 'secondary' : 'primary'}
                  >
                    {isSubmitting ? '处理中...' : isBuilt ? '升级' : '建造'}
                  </Button>
                </div>
              )
            })}
          </div>
          {inlineError && <div className="city-dialog-inline-error">{inlineError}</div>}
        </div>

        {confirmModal && (
          <Modal isOpen={true} onClose={() => setConfirmModal(null)} title={confirmModal.targetLevel === 1 ? '建造建筑' : '升级建筑'}>
            <div className="city-dialog-confirm">
              <div className="city-dialog-confirm-row">
                <span className="city-dialog-confirm-label">建筑名称</span>
                <span className="city-dialog-confirm-value">{BUILDING_NAMES[confirmModal.buildingType]}</span>
              </div>
              <div className="city-dialog-confirm-row">
                <span className="city-dialog-confirm-label">等级变化</span>
                <span className="city-dialog-confirm-value">
                  {confirmModal.targetLevel === 1 ? '新建造' : `${confirmModal.targetLevel - 1} -> ${confirmModal.targetLevel}`}
                </span>
              </div>
              <div className="city-dialog-confirm-section">资源消耗</div>
              {(['food', 'wood', 'stone', 'gold'] as const).map((key) => {
                const labels: Record<string, string> = { food: '粮食', wood: '木材', stone: '石料', gold: '黄金' }
                const current = resources?.[key] ?? 0
                const required = confirmModal.cost[key]
                const sufficient = current >= required
                return (
                  <div key={key} className="city-dialog-confirm-row">
                    <span className="city-dialog-confirm-label">{labels[key]}</span>
                    <span className={`city-dialog-confirm-value${!sufficient ? ' city-dialog-confirm-insufficient' : ''}`}>
                      {current} / {required}
                    </span>
                  </div>
                )
              })}
              <div className="city-dialog-confirm-row">
                <span className="city-dialog-confirm-label">建造时间</span>
                <span className="city-dialog-confirm-value">{formatDuration(confirmModal.cost.buildTime)}</span>
              </div>
              <div className="city-dialog-confirm-actions">
                <Button onClick={() => setConfirmModal(null)} variant="secondary">取消</Button>
                <Button onClick={async () => {
                  setUpgradingType(confirmModal.buildingType)
                  setConfirmModal(null)
                  setActionStatus('')
                  try {
                    const response = await gameClient.api.upgradeBuilding(confirmModal.buildingType)
                    if (response.code !== 0) {
                      setActionStatus(response.message || '操作失败')
                      return
                    }
                    await Promise.all([loadCityData(), syncRoleResources()])
                    addEventLog(`${confirmModal.targetLevel === 1 ? '建造' : '升级'} ${BUILDING_NAMES[confirmModal.buildingType]}`)
                  } catch (error) {
                    setActionStatus(error instanceof Error ? error.message : '操作失败')
                  } finally {
                    setUpgradingType(null)
                  }
                }} variant="primary">确认</Button>
              </div>
            </div>
          </Modal>
        )}

        <div className="city-dialog-section">
          <div className="city-dialog-section-title">建造队列</div>
          {buildQueue.length === 0 ? (
            <div className="city-dialog-note">当前没有建造队列</div>
          ) : (
            <div className="city-dialog-building-list">
              {buildQueue.map((item) => {
                const remaining = item.finishTime - now
                const totalDuration = item.finishTime - item.startTime
                const progress = totalDuration > 0 ? Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100)) : 100
                return (
                  <div key={item.id} className="city-dialog-row-card">
                    <div>
                      <div className="city-dialog-row-title">{BUILDING_NAMES[item.buildingType] ?? `建筑类型 ${item.buildingType}`}</div>
                      <div className="city-dialog-row-meta">
                        目标等级 {item.targetLevel} · 还剩 {formatDuration(Math.max(0, remaining))}
                      </div>
                      <div className="city-dialog-progress-bar">
                        <div className="city-dialog-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <Button
                      disabled={cancelingQueueId === item.id}
                      onClick={() => void handleCancelBuild(item.id)}
                      size="small"
                      variant="danger"
                    >
                      {cancelingQueueId === item.id ? '处理中...' : '取消'}
                    </Button>
                  </div>
                )
              })}
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
                    <div className="city-dialog-row-title">{BUILDING_NAMES[item.buildingType] ?? `建筑类型 ${item.buildingType}`}</div>
                    <div className="city-dialog-row-meta">目标等级 {item.targetLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {actionStatus && <div className="city-dialog-status">{actionStatus}</div>}
      </div>
    </Modal>
  )
}
