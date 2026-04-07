import { useGameStore } from '@/api/store'
import './BottomNav.css'

const NAV_ITEMS = [
  { key: 'map', label: '地图' },
  { key: 'army', label: '军队' },
  { key: 'soldier', label: '士兵' },
  { key: 'item', label: '物品' },
  { key: 'city', label: '城建' },
] as const

export default function BottomNav() {
  const { activeTab, setActiveTab, setActiveDialog } = useGameStore()

  const handleNavClick = (key: (typeof NAV_ITEMS)[number]['key']) => {
    setActiveTab(key)

    if (key === 'army') {
      setActiveDialog('army')
      return
    }

    if (key === 'soldier') {
      setActiveDialog('soldier')
      return
    }

    if (key === 'item') {
      setActiveDialog('item')
      return
    }

    if (key === 'city') {
      setActiveDialog('city')
      return
    }

    setActiveDialog(null)
  }

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          className={activeTab === item.key ? 'bottom-nav-button active' : 'bottom-nav-button'}
          onClick={() => handleNavClick(item.key)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
