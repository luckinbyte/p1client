import { useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { ArmyStatus } from '@/sdk'
import './ArmyDialog.css'

const STATUS_LABEL: Record<ArmyStatus, string> = {
  [ArmyStatus.Idle]: '空闲',
  [ArmyStatus.Marching]: '行军中',
  [ArmyStatus.Collecting]: '采集中',
  [ArmyStatus.Battle]: '战斗中',
  [ArmyStatus.Stationing]: '驻扎中',
}

export default function ArmyDialog() {
  const { activeDialog, setActiveDialog, armies, selectedArmyId, setSelectedArmyId, setArmies, addEventLog } = useGameStore()
  const [actionStatus, setActionStatus] = useState('')
  const [submittingArmyId, setSubmittingArmyId] = useState<number | null>(null)

  const selectedArmy = useMemo(
    () => armies.find((army) => army.id === selectedArmyId) ?? armies[0] ?? null,
    [armies, selectedArmyId],
  )

  const handleCancelMarch = async (armyId: number) => {
    setSubmittingArmyId(armyId)
    setActionStatus('')

    try {
      const response = await gameClient.api.cancelMarch(armyId)
      if (response.code !== 0) {
        setActionStatus(response.message || '取消行军失败')
        return
      }

      const armiesResponse = await gameClient.api.getArmies()
      if (armiesResponse.data) {
        setArmies(armiesResponse.data as never)
      }

      addEventLog(`已取消军队 #${armyId} 行军`)
      setActionStatus(`军队 #${armyId} 已取消行军`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '取消行军失败')
    } finally {
      setSubmittingArmyId(null)
    }
  }

  return (
    <Modal isOpen={activeDialog === 'army'} onClose={() => setActiveDialog(null)} title="我的军队">
      {armies.length === 0 ? (
        <div className="army-dialog-empty">暂无军队</div>
      ) : (
        <div className="army-dialog-list">
          {armies.map((army) => {
            const totalUnits = Object.values(army.soldiers).reduce((sum, count) => sum + count, 0)
            const isSelected = selectedArmy?.id === army.id
            const canCancelMarch = army.status === ArmyStatus.Marching

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
                </button>
                <div className="army-card-actions">
                  <Button disabled={!canCancelMarch || submittingArmyId === army.id} onClick={() => void handleCancelMarch(army.id)} size="small" variant="secondary">
                    {submittingArmyId === army.id ? '处理中...' : '取消行军'}
                  </Button>
                </div>
              </div>
            )
          })}
          {actionStatus && <div className="army-dialog-status">{actionStatus}</div>}
        </div>
      )}
    </Modal>
  )
}
