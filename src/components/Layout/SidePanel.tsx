import { useEffect, useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { fetchArmyState } from '@/api/hooks'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { ArmyStatus, EntityType, MarchType, ResourceType } from '@/sdk'
import { RESOURCE_TYPE_MAP } from '@/utils/constants'
import { formatTime } from '@/utils/helpers'
import './SidePanel.css'

const MARCH_TYPE_VALUE = {
  collect: 0,
  attack: 1,
  reinforce: 2,
} as const

const ACTION_LABEL = {
  collect: '采集',
  attack: '攻击',
  reinforce: '支援',
} as const

function isReturnMarch(army: { status: ArmyStatus; march?: { type?: string } }): boolean {
  return army.status === ArmyStatus.Marching && army.march?.type === MarchType.Return
}

export default function SidePanel() {
  const {
    setActiveDialog,
    armies,
    selectedArmyId,
    setSelectedArmyId,
    setArmies,
    soldiers,
    setSoldiers,
    selectedEntity,
    selectedPosition,
    eventLogs,
    clearEventLogs,
    addEventLog,
  } = useGameStore()
  const roleInfo = useGameStore((state) => state.roleInfo)
  const [actionStatus, setActionStatus] = useState('')

  // 1-second tick timer for live countdown
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))
  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  const primaryArmy = useMemo(
    () => armies.find((army) => army.id === selectedArmyId) ?? armies[0] ?? null,
    [armies, selectedArmyId],
  )
  const canMarch = primaryArmy?.status === ArmyStatus.Idle

  const refreshArmyPanelState = async () => {
    const battleState = await fetchArmyState()
    setArmies(battleState.armies)
    setSoldiers(battleState.soldiers)
  }

  const handleMarchAction = async (action: keyof typeof MARCH_TYPE_VALUE) => {
    if (!primaryArmy || !selectedEntity) {
      setActionStatus('请先选择目标和可用军队')
      return
    }

    if (!canMarch) {
      setActionStatus('当前军队不可执行新的行军指令')
      return
    }

    try {
      const response = await gameClient.api.startMarch(primaryArmy.id, MARCH_TYPE_VALUE[action], selectedEntity.id)
      if (response.code !== 0) {
        setActionStatus(response.message || '行军失败')
        return
      }
      await refreshArmyPanelState()
      addEventLog(`军队 #${primaryArmy.id} 已下达${ACTION_LABEL[action]}指令，目标 #${selectedEntity.id}`)
      setActionStatus(`已发送${ACTION_LABEL[action]}指令`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '行军失败')
    }
  }

  const { totalSoldiers, totalWounded } = useMemo(
    () => ({
      totalSoldiers: soldiers.reduce((sum, soldier) => sum + soldier.count, 0),
      totalWounded: soldiers.reduce((sum, soldier) => sum + soldier.wounded, 0),
    }),
    [soldiers],
  )

  const armyStatusLabel = useMemo(() => {
    if (!primaryArmy) return '暂无'
    if (isReturnMarch(primaryArmy)) return '返回中'
    if (primaryArmy.status === ArmyStatus.Collecting) return '采集中'
    if (primaryArmy.status === ArmyStatus.Battle) return '战斗中'
    if (primaryArmy.status === ArmyStatus.Stationing) return '驻扎中'
    if (primaryArmy.status === ArmyStatus.Marching) return '行军中'
    return '空闲'
  }, [primaryArmy])

  const targetSummary = useMemo(() => {
    if (!selectedEntity) {
      return selectedPosition ? `坐标 (${selectedPosition.x}, ${selectedPosition.y})` : '未选择'
    }

    switch (selectedEntity.type) {
      case EntityType.Resource: {
        const resourceConfig = RESOURCE_TYPE_MAP[selectedEntity.resourceType ?? ResourceType.Food] ?? RESOURCE_TYPE_MAP[1]
        return `${resourceConfig.name}点 #${selectedEntity.id}`
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

  const targetDetail = useMemo(() => {
    if (!selectedEntity) {
      return selectedPosition ? `可移动到该坐标` : '点击地图或对象后可查看详情'
    }

    const positionLabel = `坐标 (${selectedEntity.position.x}, ${selectedEntity.position.y})`

    switch (selectedEntity.type) {
      case EntityType.Resource: {
        const resourceConfig = RESOURCE_TYPE_MAP[selectedEntity.resourceType ?? ResourceType.Food] ?? RESOURCE_TYPE_MAP[1]
        return `${resourceConfig.icon} 储量 ${selectedEntity.resourceAmount ?? 0} · ${positionLabel}`
      }
      case EntityType.City:
        return `等级 ${selectedEntity.level ?? 1} · ${positionLabel}`
      case EntityType.Player:
        return `${selectedEntity.ownerId ? `归属 ${String(selectedEntity.ownerId)} · ` : ''}${positionLabel}`
      case EntityType.Monster:
        return `等级 ${selectedEntity.level ?? 1} · ${positionLabel}`
      case EntityType.Building:
        return `${positionLabel}`
      default:
        return positionLabel
    }
  }, [selectedEntity, selectedPosition])

  // Resource detail for selected resource point (D-06)
  const resourceDetail = useMemo(() => {
    if (!selectedEntity || selectedEntity.type !== EntityType.Resource) return null
    const config = RESOURCE_TYPE_MAP[selectedEntity.resourceType ?? ResourceType.Food] ?? RESOURCE_TYPE_MAP[1]
    const amount = selectedEntity.resourceAmount ?? 0
    const totalSoldiers = primaryArmy
      ? Object.values(primaryArmy.soldiers).reduce((sum, count) => sum + count, 0)
      : 0
    const estimatedYield = Math.min(totalSoldiers * 100, amount)
    const isOccupied = selectedEntity.ownerId != null && selectedEntity.ownerId !== roleInfo?.rid
    return { config, amount, estimatedYield, isOccupied }
  }, [selectedEntity, primaryArmy, roleInfo])

  // March info for selected army (D-02)
  const marchInfo = useMemo(() => {
    if (!primaryArmy || primaryArmy.status !== ArmyStatus.Marching || !primaryArmy.march) return null
    const remaining = Math.max(0, primaryArmy.march.arrivalTime - now)
    const total = primaryArmy.march.arrivalTime - primaryArmy.march.startTime
    const progress = total > 0 ? Math.min(1, (total - remaining) / total) : 0
    return { remaining, progress, targetPos: primaryArmy.march.targetPos }
  }, [primaryArmy, now])

  // Collection info for selected army (D-04)
  const collectInfo = useMemo(() => {
    if (!primaryArmy || primaryArmy.status !== ArmyStatus.Collecting || !primaryArmy.march?.collectEndTime) return null
    const remaining = Math.max(0, primaryArmy.march.collectEndTime - now)
    const total = primaryArmy.march.collectEndTime - primaryArmy.march.arrivalTime
    const progress = total > 0 ? Math.min(1, (total - remaining) / total) : 0
    const totalSoldiers = Object.values(primaryArmy.soldiers).reduce((sum, count) => sum + count, 0)
    const estimatedYield = totalSoldiers * 100
    return { remaining, progress, estimatedYield }
  }, [primaryArmy, now])

  return (
    <aside className="side-panel">
      <section className="panel-section">
        <h3 className="panel-title">快捷操作</h3>
        <div className="panel-buttons">
          <Button onClick={() => setActiveDialog('army')} variant="secondary">
            我的军队 ({armies.length})
          </Button>
          <Button onClick={() => setActiveDialog('soldier')} variant="secondary">
            训练士兵
          </Button>
          <Button disabled={totalWounded === 0} onClick={() => setActiveDialog('heal')} variant="secondary">
            伤兵营 ({totalWounded})
          </Button>
          <Button onClick={() => setActiveDialog('item')} variant="secondary">
            背包物品
          </Button>
          <Button onClick={() => setActiveDialog('city')} variant="secondary">
            城池建筑
          </Button>
        </div>
      </section>

      <section className="panel-section">
        <h3 className="panel-title">军队概览</h3>
        <div className="panel-info">
          <div className="info-row">
            <span>军队数量</span>
            <span>{armies.length}</span>
          </div>
          <div className="info-row">
            <span>士兵总数</span>
            <span>{totalSoldiers}</span>
          </div>
          <div className="info-row">
            <span>受伤士兵</span>
            <span className="wounded">{totalWounded}</span>
          </div>
        </div>
      </section>

      <section className="panel-section">
        <div className="panel-title-row">
          <h3 className="panel-title">近期事件</h3>
          <button className="panel-link-button" onClick={clearEventLogs} type="button">
            清空
          </button>
        </div>
        {eventLogs.length === 0 ? (
          <div className="event-log-empty">暂无事件</div>
        ) : (
          <div className="event-log-list">
            {eventLogs.map((item) => (
              <div key={item.id} className="event-log-item">
                {item.message}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel-section">
        <h3 className="panel-title">行军操作</h3>
        <div className="panel-info">
          <div className="info-row info-row-top army-select-row">
            <span>出征军队</span>
            <div className="army-select-group">
              <select
                className="army-select"
                disabled={armies.length === 0}
                onChange={(event) => {
                  setSelectedArmyId(Number(event.target.value))
                  setActionStatus('')
                }}
                value={primaryArmy?.id ?? ''}
              >
                {armies.length === 0 ? (
                  <option value="">暂无军队</option>
                ) : (
                  armies.map((army) => (
                    <option key={army.id} value={army.id}>
                      #{army.id} · {isReturnMarch(army) ? '返回中' : army.status === ArmyStatus.Idle ? '空闲' : '忙碌'}
                    </option>
                  ))
                )}
              </select>
              <span className={canMarch ? 'army-status idle' : 'army-status busy'}>{armyStatusLabel}</span>
            </div>
          </div>
          <div className="info-row info-row-top">
            <span>当前目标</span>
            <span className="target-value">{targetSummary}</span>
          </div>
          <div className="target-detail">{targetDetail}</div>

          {/* Resource detail view per D-06 */}
          {resourceDetail && (
            <div className="resource-detail">
              <div className="info-row">
                <span>资源类型</span>
                <span>{resourceDetail.config.icon} {resourceDetail.config.name}</span>
              </div>
              <div className="info-row">
                <span>剩余储量</span>
                <span>{resourceDetail.amount}</span>
              </div>
              <div className="info-row">
                <span>预估采集</span>
                <span className="yield-value">{resourceDetail.estimatedYield}</span>
              </div>
              {resourceDetail.isOccupied && (
                <div className="occupied-warning">已被占用</div>
              )}
            </div>
          )}

          {/* March info per D-02 */}
          {marchInfo && (
            <div className="march-info">
              <div className="info-row">
                <span>目标坐标</span>
                <span>({marchInfo.targetPos.x}, {marchInfo.targetPos.y})</span>
              </div>
              <div className="info-row">
                <span>剩余时间</span>
                <span className="eta-value">{formatTime(marchInfo.remaining)}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${marchInfo.progress * 100}%` }} />
              </div>
            </div>
          )}

          {/* Collection countdown per D-04 */}
          {collectInfo && (
            <div className="collect-info">
              <div className="info-row">
                <span>采集倒计时</span>
                <span className="eta-value">{formatTime(collectInfo.remaining)}</span>
              </div>
              <div className="info-row">
                <span>预估采集量</span>
                <span className="yield-value">{collectInfo.estimatedYield}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill collecting" style={{ width: `${collectInfo.progress * 100}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="panel-buttons march-actions">
          <Button
            disabled={!primaryArmy || !canMarch || !selectedEntity || selectedEntity.type !== EntityType.Resource || !!resourceDetail?.isOccupied}
            onClick={() => void handleMarchAction('collect')}
            variant="secondary"
          >
            采集
          </Button>
          <Button
            disabled={!primaryArmy || !canMarch || !selectedEntity}
            onClick={() => void handleMarchAction('attack')}
            variant="secondary"
          >
            攻击
          </Button>
          <Button
            disabled={!primaryArmy || !canMarch || !selectedEntity}
            onClick={() => void handleMarchAction('reinforce')}
            variant="secondary"
          >
            支援
          </Button>
        </div>
        {actionStatus && <div className="action-status">{actionStatus}</div>}
      </section>
    </aside>
  )
}
