import { useEffect, useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { soldierConfig, type Resources, type SoldierData, type TrainQueueItem } from '@/sdk'
import './SoldierDialog.css'

type SoldierConfigItem = {
  id: number
  type: number
  level: number
  name: string
  attack: number
  defense: number
  hp: number
  speed: number
  load: number
  power: number
  cost_food: number
  cost_wood: number
  cost_stone: number
  cost_gold: number
  train_time: number
}

type SoldierTypeMeta = {
  id: number
  name: string
  description: string
}

type ResourceKey = keyof Resources

const DEFAULT_TRAIN_COUNT = 100
const MIN_TRAIN_COUNT = 1
const MAX_TRAIN_COUNT = 999
const RESOURCE_KEYS: ResourceKey[] = ['food', 'wood', 'stone', 'gold']
const RESOURCE_LABELS: Record<ResourceKey, string> = {
  food: '粮食',
  wood: '木材',
  stone: '石料',
  gold: '黄金',
}
const SOLDIER_TYPE_FALLBACK: Record<number, SoldierTypeMeta> = {
  1: { id: 1, name: '步兵', description: '高防御，近战主力' },
  2: { id: 2, name: '骑兵', description: '高机动，快速突击' },
  3: { id: 3, name: '弓兵', description: '高攻击，远程输出' },
  4: { id: 4, name: '攻城', description: '攻城利器，高负重' },
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '已完成'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function clampTrainCount(value: number): number {
  if (!Number.isFinite(value)) return MIN_TRAIN_COUNT
  return Math.max(MIN_TRAIN_COUNT, Math.min(MAX_TRAIN_COUNT, Math.floor(value)))
}

function normalizeSoldiers(data: unknown): SoldierData[] {
  if (Array.isArray(data)) {
    return data as SoldierData[]
  }

  if (data && typeof data === 'object') {
    const soldiers = (data as { soldiers?: unknown }).soldiers
    if (Array.isArray(soldiers)) {
      return soldiers as SoldierData[]
    }
  }

  return []
}

function normalizeTrainQueue(data: unknown): TrainQueueItem[] {
  if (Array.isArray(data)) {
    return data as TrainQueueItem[]
  }

  if (data && typeof data === 'object') {
    const queue = (data as { queue?: unknown }).queue
    if (Array.isArray(queue)) {
      return queue as TrainQueueItem[]
    }
  }

  return []
}

function getTotalCosts(config: SoldierConfigItem, count: number): Resources {
  return {
    food: config.cost_food * count,
    wood: config.cost_wood * count,
    stone: config.cost_stone * count,
    gold: config.cost_gold * count,
  }
}

export default function SoldierDialog() {
  const { activeDialog, setActiveDialog, soldiers, trainQueue, setSoldiers, setTrainQueue, addEventLog } = useGameStore()
  const roleInfo = useGameStore((state) => state.roleInfo)
  const resources = roleInfo?.resources
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [cancelingQueueId, setCancelingQueueId] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState('')
  const [confirmModal, setConfirmModal] = useState<{
    config: SoldierConfigItem
    count: number
  } | null>(null)
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))

  const soldierMap = useMemo(() => new Map(soldiers.map((soldier) => [soldier.id, soldier])), [soldiers])
  const configs = useMemo(() => soldierConfig.soldiers as SoldierConfigItem[], [])
  const soldierTypeMeta = useMemo(
    () => (soldierConfig.soldierTypes as Record<string, SoldierTypeMeta>) ?? {},
    [],
  )
  const configById = useMemo(() => new Map(configs.map((config) => [config.id, config])), [configs])
  const configByTypeLevel = useMemo(
    () => new Map(configs.map((config) => [`${config.type}-${config.level}`, config])),
    [configs],
  )
  const groupedConfigs = useMemo(() => {
    const groups = new Map<number, SoldierConfigItem[]>()

    configs.forEach((config) => {
      const list = groups.get(config.type) ?? []
      list.push(config)
      groups.set(config.type, list)
    })

    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([type, list]) => [
        type,
        list.sort((a, b) => a.level - b.level),
      ] as const)
  }, [configs])

  const refreshSoldierData = async () => {
    try {
      const [soldiersResponse, queueResponse] = await Promise.all([
        gameClient.api.getSoldiers(),
        gameClient.api.getTrainQueue(),
      ])

      setSoldiers(normalizeSoldiers(soldiersResponse.data))
      setTrainQueue(normalizeTrainQueue(queueResponse.data))
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '读取士兵信息失败')
    }
  }

  useEffect(() => {
    if (activeDialog !== 'soldier') return
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(timer)
  }, [activeDialog])

  useEffect(() => {
    if (activeDialog === 'soldier') {
      void refreshSoldierData()
    }
  }, [activeDialog])

  const handleTrainClick = (config: SoldierConfigItem) => {
    setActionStatus('')
    setConfirmModal({ config, count: DEFAULT_TRAIN_COUNT })
  }

  const handleConfirmTrain = async () => {
    if (!confirmModal) return

    const { config, count } = confirmModal
    setSubmittingId(config.id)
    setConfirmModal(null)
    setActionStatus('')

    try {
      const response = await gameClient.api.trainSoldier(config.type, config.level, count)
      if (response.code !== 0) {
        setActionStatus(response.message || '训练失败')
        return
      }

      await refreshSoldierData()
      addEventLog(`开始训练 ${config.name} x${count}`)
      setActionStatus(`已加入训练：${config.name} x${count}`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '训练失败')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleCancelTrain = async (queueId: number) => {
    setCancelingQueueId(queueId)
    setActionStatus('')

    try {
      const response = await gameClient.api.cancelTrain(queueId)
      if (response.code !== 0) {
        setActionStatus(response.message || '取消训练失败')
        return
      }

      await refreshSoldierData()
      addEventLog(`已取消训练队列 #${queueId}`)
      setActionStatus(`已取消训练队列 #${queueId}`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '取消训练失败')
    } finally {
      setCancelingQueueId(null)
    }
  }

  const modalCost = confirmModal ? getTotalCosts(confirmModal.config, confirmModal.count) : null
  const modalHasInsufficientResources =
    confirmModal != null &&
    RESOURCE_KEYS.some((key) => (resources?.[key] ?? 0) < (modalCost?.[key] ?? 0))

  return (
    <>
      <Modal
        isOpen={activeDialog === 'soldier'}
        onClose={() => {
          setConfirmModal(null)
          setActiveDialog(null)
        }}
        title="训练士兵"
      >
        <div className="soldier-dialog">
          <section className="soldier-section">
            <div className="soldier-section-header">
              <h3>可训练兵种</h3>
              <div className="soldier-header-actions">
                <span>列表预览按每次 {DEFAULT_TRAIN_COUNT} 份训练消耗显示</span>
                <Button onClick={() => void refreshSoldierData()} size="small" variant="secondary">
                  刷新
                </Button>
              </div>
            </div>

            <div className="soldier-type-groups">
              {groupedConfigs.map(([type, group]) => {
                const meta = soldierTypeMeta[String(type)] ?? SOLDIER_TYPE_FALLBACK[type]

                return (
                  <div key={type} className="soldier-type-group">
                    <div className="soldier-type-group-header">
                      <div className="soldier-type-group-title">{meta?.name ?? `兵种 ${type}`}</div>
                      <div className="soldier-type-group-desc">{meta?.description ?? '可用于训练与作战'}</div>
                    </div>

                    <div className="soldier-type-list">
                      {group.map((config) => {
                        const current = soldierMap.get(config.id)
                        const previewCosts = getTotalCosts(config, DEFAULT_TRAIN_COUNT)

                        return (
                          <div key={config.id} className="soldier-type-card">
                            <div>
                              <div className="soldier-type-name">{config.name}</div>
                              <div className="soldier-type-meta">
                                T{config.type} Lv.{config.level} | 战力 {config.power}
                              </div>
                              <div className="soldier-type-meta">
                                驻军 {current?.count ?? 0} | 伤兵 {current?.wounded ?? 0}
                              </div>
                              <div className="soldier-type-cost">
                                粮{previewCosts.food} 木{previewCosts.wood} 石{previewCosts.stone} 金{previewCosts.gold}
                              </div>
                            </div>
                            <div className="soldier-type-card-actions">
                              <Button
                                disabled={submittingId === config.id}
                                onClick={() => handleTrainClick(config)}
                                size="small"
                                variant="secondary"
                              >
                                {submittingId === config.id ? '训练中...' : '训练'}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="soldier-section">
            <div className="soldier-section-header">
              <h3>训练队列</h3>
              <span>实时倒计时每秒刷新</span>
            </div>

            {trainQueue.length === 0 ? (
              <div className="soldier-empty">当前没有训练队列</div>
            ) : (
              <div className="soldier-queue-list">
                {trainQueue.map((item) => {
                  const config = configById.get(item.soldierId) ?? configByTypeLevel.get(`${item.soldierType}-${item.level}`)
                  const remaining = item.finishTime - now
                  const totalDuration = item.finishTime - item.startTime
                  const progress =
                    totalDuration > 0
                      ? Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100))
                      : 100

                  return (
                    <div key={item.id} className="soldier-dialog-row-card">
                      <div>
                        <div className="soldier-dialog-row-title">
                          {config?.name ?? `兵种 ${item.soldierType} Lv.${item.level}`}
                        </div>
                        <div className="soldier-dialog-row-meta">
                          数量 {item.count} | 还剩 {formatDuration(Math.max(0, remaining))}
                        </div>
                        <div className="soldier-dialog-progress-bar">
                          <div className="soldier-dialog-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <Button
                        disabled={cancelingQueueId === item.id}
                        onClick={() => void handleCancelTrain(item.id)}
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
          </section>

          {actionStatus && <div className="soldier-status">{actionStatus}</div>}
        </div>
      </Modal>

      {confirmModal && modalCost && (
        <Modal isOpen={true} onClose={() => setConfirmModal(null)} title="确认训练">
          <div className="soldier-dialog-confirm">
            <div className="soldier-dialog-confirm-row">
              <span className="soldier-dialog-confirm-label">士兵名称</span>
              <span className="soldier-dialog-confirm-value">
                {confirmModal.config.name} Lv.{confirmModal.config.level}
              </span>
            </div>

            <div className="soldier-dialog-confirm-row soldier-dialog-confirm-row-input">
              <span className="soldier-dialog-confirm-label">训练数量</span>
              <input
                className="soldier-dialog-quantity-input"
                max={MAX_TRAIN_COUNT}
                min={MIN_TRAIN_COUNT}
                onChange={(event) => {
                  const nextCount = clampTrainCount(Number(event.target.value))
                  setConfirmModal((current) => (current ? { ...current, count: nextCount } : current))
                }}
                type="number"
                value={confirmModal.count}
              />
            </div>

            <div className="soldier-dialog-confirm-section">资源消耗</div>
            {RESOURCE_KEYS.map((key) => {
              const current = resources?.[key] ?? 0
              const required = modalCost[key]
              const sufficient = current >= required

              return (
                <div key={key} className="soldier-dialog-confirm-row">
                  <span className="soldier-dialog-confirm-label">{RESOURCE_LABELS[key]}</span>
                  <span className={`soldier-dialog-confirm-value${!sufficient ? ' soldier-dialog-confirm-insufficient' : ''}`}>
                    {current} / {required}
                  </span>
                </div>
              )
            })}

            <div className="soldier-dialog-confirm-row">
              <span className="soldier-dialog-confirm-label">训练时间</span>
              <span className="soldier-dialog-confirm-value">
                {formatDuration(confirmModal.config.train_time * confirmModal.count)}
              </span>
            </div>

            <div className="soldier-dialog-confirm-actions">
              <Button onClick={() => setConfirmModal(null)} variant="secondary">
                取消
              </Button>
              <Button disabled={modalHasInsufficientResources || submittingId === confirmModal.config.id} onClick={() => void handleConfirmTrain()} variant="primary">
                {submittingId === confirmModal.config.id ? '训练中...' : '确认'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
