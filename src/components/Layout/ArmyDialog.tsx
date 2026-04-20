import { useEffect, useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { fetchArmyState } from '@/api/hooks'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { ArmyStatus, soldierConfig, type SoldierData } from '@/sdk'
import './ArmyDialog.css'

const STATUS_LABEL: Record<ArmyStatus, string> = {
  [ArmyStatus.Idle]: '空闲',
  [ArmyStatus.Marching]: '行军中',
  [ArmyStatus.Collecting]: '采集中',
  [ArmyStatus.Battle]: '战斗中',
  [ArmyStatus.Stationing]: '驻扎中',
}

const MAX_ARMY_COUNT = 5

type SoldierConfigItem = {
  id: number
  type: number
  level: number
  name: string
}

function clampCount(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.max(0, Math.min(max, Math.floor(value)))
}

function getTotalUnits(soldiers: Record<number, number>): number {
  return Object.values(soldiers).reduce((sum, count) => sum + count, 0)
}

export default function ArmyDialog() {
  const {
    activeDialog,
    setActiveDialog,
    armies,
    selectedArmyId,
    setSelectedArmyId,
    setArmies,
    soldiers,
    setSoldiers,
    cityInfo,
    sceneId,
    addEventLog,
  } = useGameStore()
  const [actionStatus, setActionStatus] = useState('')
  const [submittingArmyId, setSubmittingArmyId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [draft, setDraft] = useState<Record<number, number>>({})

  const configMap = useMemo(
    () => new Map((soldierConfig.soldiers as SoldierConfigItem[]).map((config) => [config.id, config])),
    [],
  )

  const availableSoldiers = useMemo(() => soldiers.filter((soldier) => soldier.count > 0), [soldiers])
  const selectedArmy = useMemo(
    () => armies.find((army) => army.id === selectedArmyId) ?? armies[0] ?? null,
    [armies, selectedArmyId],
  )
  const selectedTotal = useMemo(
    () => Object.values(draft).reduce((sum, count) => sum + count, 0),
    [draft],
  )
  const canCreateArmy = selectedTotal > 0 && armies.length < MAX_ARMY_COUNT && !!cityInfo

  const refreshArmyState = async () => {
    const battleState = await fetchArmyState()
    setArmies(battleState.armies)
    setSoldiers(battleState.soldiers)
  }

  useEffect(() => {
    if (activeDialog !== 'army') return
    void refreshArmyState()
  }, [activeDialog])

  useEffect(() => {
    if (activeDialog !== 'army') return

    setDraft((current) => {
      const next: Record<number, number> = {}
      availableSoldiers.forEach((soldier) => {
        const currentValue = current[soldier.id] ?? 0
        if (currentValue > 0) {
          next[soldier.id] = Math.min(currentValue, soldier.count)
        }
      })
      return next
    })
  }, [activeDialog, availableSoldiers])

  const updateDraft = (soldier: SoldierData, value: string) => {
    const nextValue = clampCount(Number(value), soldier.count)
    setDraft((current) => {
      const next = { ...current }
      if (nextValue <= 0) {
        delete next[soldier.id]
      } else {
        next[soldier.id] = nextValue
      }
      return next
    })
  }

  const resetCreateForm = () => {
    setDraft({})
    setIsCreating(false)
  }

  const handleCreateArmy = async () => {
    if (!cityInfo) {
      setActionStatus('缺少城池坐标，无法创建军队')
      return
    }

    if (selectedTotal <= 0) {
      setActionStatus('请至少选择一支部队')
      return
    }

    setIsCreating(true)
    setActionStatus('')

    try {
      const response = await gameClient.api.createArmy(0, draft, sceneId || 1, cityInfo.position.x, cityInfo.position.y)
      if (response.code !== 0) {
        setActionStatus(response.message || '创建军队失败')
        return
      }

      // D-02: Extract army_id from response for auto-select
      const responseData = response.data as { army_id?: number } | undefined
      const newArmyId = responseData?.army_id

      await refreshArmyState()

      // Auto-select the newly created army per D-02
      if (typeof newArmyId === 'number') {
        setSelectedArmyId(newArmyId)
      }

      addEventLog(`已创建军队 #${newArmyId ?? ''}，兵力 ${selectedTotal}`)
      setActionStatus(`建军成功，军队 #${newArmyId ?? ''} 已编入 ${selectedTotal} 名士兵`)
      resetCreateForm()
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '创建军队失败')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelMarch = async (armyId: number) => {
    setSubmittingArmyId(armyId)
    setActionStatus('')

    try {
      const response = await gameClient.api.cancelMarch(armyId)
      if (response.code !== 0) {
        setActionStatus(response.message || '取消行军失败')
        return
      }

      await refreshArmyState()
      addEventLog(`已取消军队 #${armyId} 行军`)
      setActionStatus(`军队 #${armyId} 已取消行军`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '取消行军失败')
    } finally {
      setSubmittingArmyId(null)
    }
  }

  const handleDisbandArmy = async (armyId: number) => {
    setSubmittingArmyId(armyId)
    setActionStatus('')

    try {
      const response = await gameClient.api.deleteArmy(armyId)
      if (response.code !== 0) {
        setActionStatus(response.message || '解散军队失败')
        return
      }

      await refreshArmyState()
      addEventLog(`已解散军队 #${armyId}，士兵返回驻军`)
      setActionStatus(`军队 #${armyId} 已解散，士兵已返回驻军`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '解散军队失败')
    } finally {
      setSubmittingArmyId(null)
    }
  }

  return (
    <Modal isOpen={activeDialog === 'army'} onClose={() => setActiveDialog(null)} title="我的军队">
      <div className="army-dialog-layout">
        <section className="army-dialog-section">
          <div className="army-dialog-section-header">
            <div>
              <h3>编组军队</h3>
              <span>从当前驻军中选择士兵，最多可拥有 {MAX_ARMY_COUNT} 支军队</span>
            </div>
            <Button onClick={() => void refreshArmyState()} size="small" variant="secondary">
              刷新
            </Button>
          </div>

          {availableSoldiers.length === 0 ? (
            <div className="army-dialog-empty">当前没有可编组士兵</div>
          ) : (
            <div className="army-create-list">
              {availableSoldiers.map((soldier) => {
                const config = configMap.get(soldier.id)
                const selectedCount = draft[soldier.id] ?? 0
                return (
                  <div key={soldier.id} className="army-create-card">
                    <div>
                      <div className="army-create-name">{config?.name ?? `士兵 ${soldier.id}`}</div>
                      <div className="army-create-meta">
                        ID {soldier.id} · 类型 {soldier.type} · Lv.{soldier.level} · 驻军 {soldier.count}
                      </div>
                    </div>
                    <div className="army-create-input-wrap">
                      <input
                        className="army-create-input"
                        inputMode="numeric"
                        min={0}
                        max={soldier.count}
                        onChange={(event) => updateDraft(soldier, event.target.value)}
                        type="number"
                        value={selectedCount}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="army-create-footer">
            <div className="army-create-summary">
              已选兵力 <strong>{selectedTotal}</strong>
              <span>当前军队 {armies.length}/{MAX_ARMY_COUNT}</span>
            </div>
            <div className="army-create-actions">
              <Button onClick={resetCreateForm} size="small" variant="secondary">
                清空
              </Button>
              <Button disabled={!canCreateArmy || isCreating} onClick={() => void handleCreateArmy()} size="small">
                {isCreating ? '建军中...' : '创建军队'}
              </Button>
            </div>
          </div>
        </section>

        <section className="army-dialog-section">
          <div className="army-dialog-section-header">
            <div>
              <h3>军队列表</h3>
              <span>选择军队可联动侧边栏出征目标</span>
            </div>
          </div>

          {armies.length === 0 ? (
            <div className="army-dialog-empty">暂无军队</div>
          ) : (
            <div className="army-dialog-list">
              {armies.map((army) => {
                const totalUnits = getTotalUnits(army.soldiers)
                const isSelected = selectedArmy?.id === army.id
                const canCancelMarch = army.status === ArmyStatus.Marching || army.status === ArmyStatus.Collecting
                const canDisband = army.status === ArmyStatus.Idle
                const composition = Object.entries(army.soldiers)
                  .map(([soldierId, count]) => `${configMap.get(Number(soldierId))?.name ?? `士兵 ${soldierId}`} x${count}`)
                  .join('，')

                return (
                  <div key={army.id} className={isSelected ? 'army-card selected' : 'army-card'}>
                    <button
                      className="army-card-select"
                      onClick={() => {
                        setSelectedArmyId(army.id)
                        setActionStatus('')
                      }}
                      type="button"
                    >
                      <div className="army-card-header">
                        <span className="army-card-title">军队 #{army.id}</span>
                        <span className={army.status === ArmyStatus.Idle ? 'army-card-status idle' : 'army-card-status'}>
                          {STATUS_LABEL[army.status]}
                        </span>
                      </div>
                      <div className="army-card-grid">
                        <div className="army-card-item">
                          <span>武将</span>
                          <strong>{army.heroId || '未配置'}</strong>
                        </div>
                        <div className="army-card-item">
                          <span>兵力</span>
                          <strong>{totalUnits}</strong>
                        </div>
                        <div className="army-card-item">
                          <span>坐标</span>
                          <strong>
                            ({army.position.x}, {army.position.y})
                          </strong>
                        </div>
                        <div className="army-card-item">
                          <span>场景</span>
                          <strong>{army.sceneId}</strong>
                        </div>
                      </div>
                      <div className="army-card-composition">{composition || '暂无编组'}</div>
                    </button>
                    <div className="army-card-actions">
                      <Button
                        disabled={!canCancelMarch || submittingArmyId === army.id}
                        onClick={() => void handleCancelMarch(army.id)}
                        size="small"
                        variant="secondary"
                      >
                        {submittingArmyId === army.id && canCancelMarch ? '处理中...' : '取消行军'}
                      </Button>
                      <Button
                        disabled={!canDisband || submittingArmyId === army.id}
                        onClick={() => void handleDisbandArmy(army.id)}
                        size="small"
                        variant="danger"
                      >
                        {submittingArmyId === army.id && canDisband ? '处理中...' : '解散'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {actionStatus && <div className="army-dialog-status">{actionStatus}</div>}
      </div>
    </Modal>
  )
}
