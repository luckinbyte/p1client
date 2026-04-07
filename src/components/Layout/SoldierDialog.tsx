import { useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { soldierConfig } from '@/sdk'
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

const DEFAULT_TRAIN_COUNT = 100

export default function SoldierDialog() {
  const { activeDialog, setActiveDialog, soldiers, trainQueue, setSoldiers, setTrainQueue, addEventLog } = useGameStore()
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState('')

  const soldierMap = useMemo(() => new Map(soldiers.map((soldier) => [soldier.id, soldier])), [soldiers])
  const configs = useMemo(() => soldierConfig.soldiers as SoldierConfigItem[], [])
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [dismissingId, setDismissingId] = useState<number | null>(null)

  const refreshSoldierData = async () => {
    const [soldiersResponse, queueResponse] = await Promise.all([
      gameClient.api.getSoldiers(),
      gameClient.api.getTrainQueue(),
    ])

    if (soldiersResponse.data) {
      setSoldiers(soldiersResponse.data as never)
    }
    if (queueResponse.data) {
      setTrainQueue(queueResponse.data as never)
    }
  }

  const handleLoadStats = async () => {
    setStatsLoading(true)
    setActionStatus('')

    try {
      const response = await gameClient.api.getSoldierStats()
      if (response.code !== 0) {
        setActionStatus(response.message || '读取统计失败')
        return
      }

      setStats((response.data as Record<string, number> | undefined) ?? null)
      addEventLog('已读取士兵统计')
      setActionStatus('已刷新士兵统计')
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '读取统计失败')
    } finally {
      setStatsLoading(false)
    }
  }

  const handleDismissSoldier = async (soldierId: number, count: number) => {
    setDismissingId(soldierId)
    setActionStatus('')

    try {
      const response = await gameClient.api.dismissSoldier(soldierId, count)
      if (response.code !== 0) {
        setActionStatus(response.message || '解散士兵失败')
        return
      }

      await refreshSoldierData()
      addEventLog(`已解散士兵 ${soldierId} x${count}`)
      setActionStatus(`已解散士兵 ${soldierId} x${count}`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '解散士兵失败')
    } finally {
      setDismissingId(null)
    }
  }

  const handleCancelTrain = async (queueId: number) => {
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
    }
  }

  const handleTrain = async (config: SoldierConfigItem) => {
    setSubmittingId(config.id)
    setActionStatus('')

    try {
      const response = await gameClient.api.trainSoldier(config.type, config.level, DEFAULT_TRAIN_COUNT)
      if (response.code !== 0) {
        setActionStatus(response.message || '训练失败')
        return
      }

      await refreshSoldierData()

      addEventLog(`开始训练 ${config.name} x${DEFAULT_TRAIN_COUNT}`)
      setActionStatus(`已加入训练：${config.name} x${DEFAULT_TRAIN_COUNT}`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '训练失败')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleCompleteTrain = async () => {
    setActionStatus('')

    try {
      const response = await gameClient.api.completeTrain()
      if (response.code !== 0) {
        setActionStatus(response.message || '领取训练失败')
        return
      }

      await refreshSoldierData()

      addEventLog('已刷新训练队列并尝试领取训练结果')
      setActionStatus('已刷新训练队列')
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '领取训练失败')
    }
  }

  return (
    <Modal isOpen={activeDialog === 'soldier'} onClose={() => setActiveDialog(null)} title="训练士兵">
      <div className="soldier-dialog">
        <section className="soldier-section">
          <div className="soldier-section-header">
            <h3>可训练兵种</h3>
            <div className="soldier-header-actions">
              <span>默认每次训练 {DEFAULT_TRAIN_COUNT}</span>
              <Button onClick={() => void handleLoadStats()} size="small" variant="secondary">
                {statsLoading ? '统计中...' : '士兵统计'}
              </Button>
            </div>
          </div>

          {stats && (
            <div className="soldier-stats-grid">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="soldier-stats-card">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="soldier-card-list">
            {configs.map((config) => {
              const current = soldierMap.get(config.id)

              return (
                <div key={config.id} className="soldier-card">
                  <div className="soldier-card-top">
                    <div>
                      <div className="soldier-name">{config.name}</div>
                      <div className="soldier-meta">
                        T{config.type} · Lv.{config.level} · 战力 {config.power}
                      </div>
                    </div>
                    <div className="soldier-card-actions">
                      <Button
                        disabled={submittingId === config.id}
                        onClick={() => void handleTrain(config)}
                        size="small"
                        variant="secondary"
                      >
                        {submittingId === config.id ? '训练中...' : '训练'}
                      </Button>
                      <Button
                        disabled={dismissingId === config.id || (current?.count ?? 0) === 0}
                        onClick={() => void handleDismissSoldier(config.id, 1)}
                        size="small"
                        variant="secondary"
                      >
                        {dismissingId === config.id ? '处理中...' : '解散1个'}
                      </Button>
                    </div>

                  </div>
                  <div className="soldier-grid">
                    <div>
                      <span>已有</span>
                      <strong>{current?.count ?? 0}</strong>
                    </div>
                    <div>
                      <span>伤兵</span>
                      <strong>{current?.wounded ?? 0}</strong>
                    </div>
                    <div>
                      <span>消耗</span>
                      <strong>
                        粮{config.cost_food} 木{config.cost_wood}
                      </strong>
                    </div>
                    <div>
                      <span>耗时</span>
                      <strong>{config.train_time}s</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="soldier-section">
          <div className="soldier-section-header">
            <h3>训练队列</h3>
            <Button disabled={trainQueue.length === 0} onClick={() => void handleCompleteTrain()} size="small" variant="secondary">
              刷新/领取
            </Button>
          </div>
          {trainQueue.length === 0 ? (
            <div className="soldier-empty">当前没有训练队列</div>
          ) : (
            <div className="queue-list">
              {trainQueue.map((item) => (
                <div key={item.id} className="queue-item">
                  <div className="queue-title-row">
                    <div className="queue-title">队列 #{item.id}</div>
                    <Button onClick={() => void handleCancelTrain(item.id)} size="small" variant="secondary">
                      取消
                    </Button>
                  </div>
                  <div className="queue-meta">
                    兵种 {item.soldierId} · 数量 {item.count} · 完成时间 {new Date(item.finishTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {actionStatus && <div className="soldier-status">{actionStatus}</div>}
      </div>
    </Modal>
  )
}
