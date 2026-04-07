import { useMemo, useState } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import type { ItemData } from '@/sdk'
import './ItemDialog.css'

type ItemView = ItemData & {
  label: string
}

export default function ItemDialog() {
  const { activeDialog, setActiveDialog, items, setItems, addEventLog } = useGameStore()
  const [usingItemId, setUsingItemId] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState('')

  const itemList = useMemo<ItemView[]>(
    () => items.map((item) => ({ ...item, label: `物品 #${item.configId}` })),
    [items],
  )

  const handleRefresh = async () => {
    setActionStatus('')

    try {
      const response = await gameClient.api.getItems()
      if (response.code !== 0) {
        setActionStatus(response.message || '刷新物品失败')
        return
      }

      if (response.data) {
        setItems(response.data as never)
      }

      addEventLog('已刷新背包物品列表')
      setActionStatus('已刷新背包')
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '刷新物品失败')
    }
  }

  const handleUseItem = async (item: ItemView) => {
    setUsingItemId(item.id)
    setActionStatus('')

    try {
      const response = await gameClient.api.useItem(item.id, 1)
      if (response.code !== 0) {
        setActionStatus(response.message || '使用物品失败')
        return
      }

      const itemsResponse = await gameClient.api.getItems()
      if (itemsResponse.data) {
        setItems(itemsResponse.data as never)
      }

      addEventLog(`使用物品：${item.label} x1`)
      setActionStatus(`已使用 ${item.label}`)
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : '使用物品失败')
    } finally {
      setUsingItemId(null)
    }
  }

  return (
    <Modal isOpen={activeDialog === 'item'} onClose={() => setActiveDialog(null)} title="背包物品">
      <div className="item-dialog">
        <div className="item-dialog-header">
          <div>
            <h3>当前背包</h3>
            <span>基于 SDK 已支持的列表/使用协议</span>
          </div>
          <Button onClick={() => void handleRefresh()} size="small" variant="secondary">
            刷新
          </Button>
        </div>

        {itemList.length === 0 ? (
          <div className="item-empty">当前没有物品</div>
        ) : (
          <div className="item-list">
            {itemList.map((item) => (
              <div key={item.id} className="item-card">
                <div>
                  <div className="item-name">{item.label}</div>
                  <div className="item-meta">
                    实例 ID {item.id} · 配置 ID {item.configId}
                  </div>
                </div>
                <div className="item-card-side">
                  <strong>x{item.count}</strong>
                  <Button
                    disabled={usingItemId === item.id || item.count <= 0}
                    onClick={() => void handleUseItem(item)}
                    size="small"
                    variant="secondary"
                  >
                    {usingItemId === item.id ? '使用中...' : '使用1个'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {actionStatus && <div className="item-status">{actionStatus}</div>}
      </div>
    </Modal>
  )
}
