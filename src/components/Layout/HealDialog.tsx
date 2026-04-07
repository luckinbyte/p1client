import { useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { soldierConfig } from '@/sdk'
import './HealDialog.css'

type SoldierConfigItem = {
  id: number
  name: string
  heal_food?: number
  heal_wood?: number
  heal_time?: number
  healFood?: number
  healWood?: number
  healTime?: number
}

export default function HealDialog() {
  const { activeDialog, setActiveDialog, soldiers, healQueue, setSoldiers, setHealQueue, addEventLog } = useGameStore()
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState('')

  const configMap = useMemo(
    () => new Map((soldierConfig.soldiers as SoldierConfigItem[]).map((config) => [config.id, config])),
    [],
  )
  const woundedSoldiers = useMemo(() => soldiers.filter((soldier) => soldier.wounded > 0), [soldiers])

  const handleHeal = async (soldierId: number, count: number) => {
    setSubmittingId(soldierId)
    setActionStatus('')

    try {
      const response = await gameClient.api.healSoldiers([{ soldier_id: soldierId, count }])
      if (response.code !== 0) {
        setActionStatus(response.message || '治疗失败')
        return
      }

      const [soldiersResponse, queueResponse] = await Promise.all([
        gameClient.api.getSoldiers(),
        gameClient.api.getHealQueue(),
      ])

      if (soldiersResponse.data) {
        setSoldiers(soldiersResponse.data as never)
      }
      if (queueResponse.data) {
        setHealQueue(queueResponse.data as never)
      }

      addEventLog(`开始治疗 士兵 ${soldierId} x${count}`)
      setActionStatus(`已加入治疗：士兵 ${soldierId} x${count}`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '治疗失败')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleCompleteHeal = async () => {
    setActionStatus('')

    try {
      const response = await gameClient.api.completeHeal()
      if (response.code !== 0) {
        setActionStatus(response.message || '领取治疗失败')
        return
      }

      const [soldiersResponse, queueResponse] = await Promise.all([
        gameClient.api.getSoldiers(),
        gameClient.api.getHealQueue(),
      ])

      if (soldiersResponse.data) {
        setSoldiers(soldiersResponse.data as never)
      }
      if (queueResponse.data) {
        setHealQueue(queueResponse.data as never)
      }

      addEventLog('已刷新治疗队列并尝试领取治疗结果')
      setActionStatus('已刷新治疗队列')
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '领取治疗失败')
    }
  }

  return (
    <Modal isOpen={activeDialog === 'heal'} onClose={() => setActiveDialog(null)} title="伤兵营">
      <div className="heal-dialog">
        <section className="heal-section">
          <div className="heal-section-header">
            <h3>待治疗伤兵</h3>
            <span>按当前伤兵数量全部治疗</span>
          </div>
          {woundedSoldiers.length === 0 ? (
            <div className="heal-empty">当前没有伤兵</div>
          ) : (
            <div className="heal-card-list">
              {woundedSoldiers.map((soldier) => {
                const config = configMap.get(soldier.id)
                const healFood = config?.healFood ?? config?.heal_food ?? 0
                const healWood = config?.healWood ?? config?.heal_wood ?? 0
                const healTime = config?.healTime ?? config?.heal_time ?? 0

                return (
                  <div key={soldier.id} className="heal-card">
                    <div className="heal-card-top">
                      <div>
                        <div className="heal-name">{config?.name ?? `士兵 ${soldier.id}`}</div>
                        <div className="heal-meta">
                          ID {soldier.id} · 类型 {soldier.type} · Lv.{soldier.level}
                        </div>
                      </div>
                      <Button
                        disabled={submittingId === soldier.id}
                        onClick={() => void handleHeal(soldier.id, soldier.wounded)}
                        size="small"
                        variant="secondary"
                      >
                        {submittingId === soldier.id ? '治疗中...' : '全部治疗'}
                      </Button>
                    </div>
                    <div className="heal-grid">
                      <div>
                        <span>伤兵数量</span>
                        <strong>{soldier.wounded}</strong>
                      </div>
                      <div>
                        <span>健康数量</span>
                        <strong>{soldier.count}</strong>
                      </div>
                      <div>
                        <span>消耗</span>
                        <strong>
                          粮{healFood} 木{healWood}
                        </strong>
                      </div>
                      <div>
                        <span>耗时</span>
                        <strong>{healTime}s</strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="heal-section">
          <div className="heal-section-header">
            <h3>治疗队列</h3>
            <Button disabled={healQueue.length === 0} onClick={() => void handleCompleteHeal()} size="small" variant="secondary">
              刷新/领取
            </Button>
          </div>
          {healQueue.length === 0 ? (
            <div className="heal-empty">当前没有治疗队列</div>
          ) : (
            <div className="queue-list">
              {healQueue.map((item) => (
                <div key={item.id} className="queue-item">
                  <div className="queue-title">队列 #{item.id}</div>
                  <div className="queue-meta">
                    治疗兵种 {Object.entries(item.soldiers)
                      .map(([soldierId, count]) => `${soldierId} x${count}`)
                      .join('，')} · 完成时间 {new Date(item.finishTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {actionStatus && <div className="heal-status">{actionStatus}</div>}
      </div>
    </Modal>
  )
}
