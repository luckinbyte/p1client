import { useMemo } from 'react'
import { useGameStore } from '@/api/store'
import SidePanel from '@/components/Layout/SidePanel'
import BottomNav from '@/components/Layout/BottomNav'
import ArmyDialog from '@/components/Layout/ArmyDialog'
import SoldierDialog from '@/components/Layout/SoldierDialog'
import HealDialog from '@/components/Layout/HealDialog'
import ItemDialog from '@/components/Layout/ItemDialog'
import CityDialog from '@/components/Layout/CityDialog'
import MobileMapOverlay from '@/components/Layout/MobileMapOverlay'
import GameCanvas from '@/components/Map/GameCanvas'
import { useResponsive } from '@/hooks/useResponsive'
import './GameLayout.css'

export default function GameLayout() {
  const { roleInfo, battleStatus, setBattleStatus } = useGameStore()
  const { isMobile } = useResponsive()

  const resources = useMemo(
    () => ({
      food: roleInfo?.resources.food ?? 0,
      wood: roleInfo?.resources.wood ?? 0,
      stone: roleInfo?.resources.stone ?? 0,
      gold: roleInfo?.resources.gold ?? 0,
    }),
    [roleInfo],
  )

  return (
    <div className="game-layout">
      <header className="game-header">
        <div className="header-player">{roleInfo?.name ?? '未登录玩家'}</div>
        <div className="header-resources">
          <span>🌾 {resources.food}</span>
          <span>🪵 {resources.wood}</span>
          <span>🪨 {resources.stone}</span>
          <span>🪙 {resources.gold}</span>
        </div>
      </header>

      <main className="game-main">
        <section className="game-map-area">
          <GameCanvas />
          {battleStatus && (
            <div className="battle-toast" onClick={() => setBattleStatus('')}>
              {battleStatus}
            </div>
          )}
          {isMobile && <MobileMapOverlay />}
        </section>

        {!isMobile && <SidePanel />}
      </main>

      {isMobile && <BottomNav />}
      <ArmyDialog />
      <SoldierDialog />
      <HealDialog />
      <ItemDialog />
      <CityDialog />
    </div>
  )
}
