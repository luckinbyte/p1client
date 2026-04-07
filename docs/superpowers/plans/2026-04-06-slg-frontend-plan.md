# SLG网页游戏前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于已实现的后端SDK，开发一个支持PC和移动端的SLG网页游戏前端

**Architecture:** React 18 + TypeScript + Vite 作为UI框架，Three.js 实现2.5D地图渲染，Zustand 管理全局状态，WebSocket 与后端SDK通信

**Tech Stack:** React 18, TypeScript, Vite, Three.js, Zustand, WebSocket

---

## 文件结构

实施过程中将创建以下文件：

```
p1client/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── vite-env.d.ts
│   │
│   ├── sdk/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── protocol.ts
│   │   └── config/
│   │       └── soldier.json
│   │
│   ├── api/
│   │   ├── client.ts
│   │   ├── store.ts
│   │   └── hooks.ts
│   │
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   ├── hooks/
│   │   ├── useGame.ts
│   │   └── useResponsive.ts
│   │
│   ├── game/
│   │   ├── GameScene.ts
│   │   ├── MapRenderer.ts
│   │   ├── EntityRenderer.ts
│   │   ├── CameraController.ts
│   │   ├── MarchAnimation.ts
│   │   └── SelectionManager.ts
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css
│   │   │   ├── Modal.tsx
│   │   │   └── Modal.css
│   │   │
│   │   ├── Login/
│   │   │   ├── LoginPage.tsx
│   │   │   └── LoginPage.css
│   │   │
│   │   ├── Layout/
│   │   │   ├── TopBar.tsx
│   │   │   ├── TopBar.css
│   │   │   ├── SidePanel.tsx
│   │   │   ├── SidePanel.css
│   │   │   ├── BottomNav.tsx
│   │   │   └── BottomNav.css
│   │   │
│   │   ├── Map/
│   │   │   ├── GameCanvas.tsx
│   │   │   └── GameCanvas.css
│   │   │
│   │   └── dialogs/
│   │       ├── ArmyDialog.tsx
│   │       ├── ArmyDialog.css
│   │       ├── SoldierDialog.tsx
│   │       ├── SoldierDialog.css
│   │       ├── HealDialog.tsx
│   │       ├── HealDialog.css
│   │       ├── BattleReport.tsx
│   │       └── BattleReport.css
│   │
│   └── types/
│       └── index.ts
│
└── public/
    └── favicon.ico
```

---

## Phase 1: 基础框架

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`
- Create: `src/index.css`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "slg-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/three": "^0.160.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
})
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>SLG Game</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 7: 创建 src/index.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #1a1a2e;
  color: #ffffff;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #1a1a2e;
}

::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}
```

- [ ] **Step 8: 创建 src/App.css**

```css
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #888;
}
```

- [ ] **Step 9: 创建 src/App.tsx**

```tsx
import { useGameStore } from '@/api/store'
import LoginPage from '@/components/Login/LoginPage'
import GameLayout from '@/components/Layout/GameLayout'
import './App.css'

function App() {
  const { isLoggedIn } = useGameStore()

  if (!isLoggedIn) {
    return <LoginPage />
  }

  return <GameLayout />
}

export default App
```

- [ ] **Step 10: 创建 src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 11: 安装依赖**

Run: `cd /root/ai_project/p1client && npm install`

Expected: 依赖安装成功

- [ ] **Step 12: 验证项目启动**

Run: `npm run dev`

Expected: 开发服务器启动在 http://localhost:3000（此时会报错缺少组件，正常）

---

### Task 2: SDK集成

**Files:**
- Copy: `src/sdk/types.ts` (from SDK)
- Copy: `src/sdk/api.ts` (from SDK)
- Copy: `src/sdk/protocol.ts` (from SDK)
- Copy: `src/sdk/config/soldier.json` (from SDK)
- Create: `src/sdk/index.ts`

- [ ] **Step 1: 创建 sdk 目录并复制类型定义**

```bash
mkdir -p /root/ai_project/p1client/src/sdk/config
cp /root/ai_project/wg_ai/sdk/frontend/src/types.ts /root/ai_project/p1client/src/sdk/types.ts
```

- [ ] **Step 2: 复制 API 客户端**

```bash
cp /root/ai_project/wg_ai/sdk/frontend/src/api.ts /root/ai_project/p1client/src/sdk/api.ts
```

- [ ] **Step 3: 复制协议定义**

```bash
cp /root/ai_project/wg_ai/sdk/frontend/src/protocol.ts /root/ai_project/p1client/src/sdk/protocol.ts
```

- [ ] **Step 4: 复制士兵配置**

```bash
cp /root/ai_project/wg_ai/sdk/frontend/config/soldier.json /root/ai_project/p1client/src/sdk/config/soldier.json
```

- [ ] **Step 5: 创建 src/sdk/index.ts 导出入口**

```typescript
export * from './types'
export * from './api'
export * from './protocol'
export { default as soldierConfig } from './config/soldier.json'
```

- [ ] **Step 6: 验证 SDK 导入**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 3: 状态管理 (Zustand Store)

**Files:**
- Create: `src/api/store.ts`
- Create: `src/api/client.ts`
- Create: `src/api/hooks.ts`

- [ ] **Step 1: 创建 src/api/client.ts**

```typescript
import { WSClient, GameAPI } from '@/sdk'

const WS_URL = 'ws://localhost:8080/ws'

class GameClient {
  public ws: WSClient
  public api: GameAPI

  constructor() {
    this.ws = new WSClient({
      url: WS_URL,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
    })
    this.api = new GameAPI(this.ws)
  }

  async connect(): Promise<void> {
    return this.ws.connect()
  }

  disconnect(): void {
    this.ws.disconnect()
  }
}

export const gameClient = new GameClient()
```

- [ ] **Step 2: 创建 src/api/store.ts**

```typescript
import { create } from 'zustand'
import type { RoleInfo, ArmyData, SoldierData, TrainQueueItem, HealQueueItem, SceneObject, Resources } from '@/sdk'

interface GameState {
  // 连接状态
  isConnected: boolean
  isLoggedIn: boolean

  // 玩家信息
  roleInfo: RoleInfo | null

  // 场景数据
  sceneId: number
  sceneObjects: SceneObject[]

  // 军队数据
  armies: ArmyData[]

  // 士兵数据
  soldiers: SoldierData[]
  trainQueue: TrainQueueItem[]
  healQueue: HealQueueItem[]

  // UI 状态
  selectedEntity: SceneObject | null
  activeDialog: string | null
  activeTab: 'map' | 'army' | 'soldier' | 'item'

  // Actions
  setConnected: (connected: boolean) => void
  setLoggedIn: (loggedIn: boolean) => void
  setRoleInfo: (info: RoleInfo | null) => void
  setSceneId: (id: number) => void
  setSceneObjects: (objects: SceneObject[]) => void
  addSceneObject: (object: SceneObject) => void
  removeSceneObject: (id: number) => void
  setArmies: (armies: ArmyData[]) => void
  setSoldiers: (soldiers: SoldierData[]) => void
  setTrainQueue: (queue: TrainQueueItem[]) => void
  setHealQueue: (queue: HealQueueItem[]) => void
  setSelectedEntity: (entity: SceneObject | null) => void
  setActiveDialog: (dialog: string | null) => void
  setActiveTab: (tab: 'map' | 'army' | 'soldier' | 'item') => void
  updateResources: (resources: Partial<Resources>) => void
  logout: () => void
}

export const useGameStore = create<GameState>((set) => ({
  // 初始状态
  isConnected: false,
  isLoggedIn: false,
  roleInfo: null,
  sceneId: 0,
  sceneObjects: [],
  armies: [],
  soldiers: [],
  trainQueue: [],
  healQueue: [],
  selectedEntity: null,
  activeDialog: null,
  activeTab: 'map',

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  setLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
  setRoleInfo: (info) => set({ roleInfo: info }),
  setSceneId: (id) => set({ sceneId: id }),
  setSceneObjects: (objects) => set({ sceneObjects: objects }),
  addSceneObject: (object) => set((state) => ({
    sceneObjects: [...state.sceneObjects, object]
  })),
  removeSceneObject: (id) => set((state) => ({
    sceneObjects: state.sceneObjects.filter(o => o.id !== id)
  })),
  setArmies: (armies) => set({ armies }),
  setSoldiers: (soldiers) => set({ soldiers }),
  setTrainQueue: (queue) => set({ trainQueue: queue }),
  setHealQueue: (queue) => set({ healQueue: queue }),
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  setActiveDialog: (dialog) => set({ activeDialog: dialog }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  updateResources: (resources) => set((state) => ({
    roleInfo: state.roleInfo
      ? { ...state.roleInfo, resources: { ...state.roleInfo.resources, ...resources } }
      : null
  })),
  logout: () => set({
    isLoggedIn: false,
    roleInfo: null,
    sceneObjects: [],
    armies: [],
    soldiers: [],
    trainQueue: [],
    healQueue: [],
    selectedEntity: null,
    activeDialog: null,
  }),
}))
```

- [ ] **Step 3: 创建 src/api/hooks.ts**

```typescript
import { useEffect, useCallback } from 'react'
import { useGameStore } from './store'
import { gameClient } from './client'
import { PushMsgID } from '@/sdk'
import type { ApiResponse } from '@/sdk'

export function useWebSocket() {
  const { setConnected, setLoggedIn } = useGameStore()

  const connect = useCallback(async () => {
    try {
      gameClient.ws.onConnected = () => {
        setConnected(true)
        console.log('WebSocket connected')
      }

      gameClient.ws.onDisconnected = () => {
        setConnected(false)
        setLoggedIn(false)
        console.log('WebSocket disconnected')
      }

      gameClient.ws.onError = (error) => {
        console.error('WebSocket error:', error)
      }

      await gameClient.connect()
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }, [setConnected, setLoggedIn])

  const disconnect = useCallback(() => {
    gameClient.disconnect()
  }, [])

  return { connect, disconnect }
}

export function usePushHandlers() {
  const { addSceneObject, removeSceneObject, setArmies, setActiveDialog } = useGameStore()

  useEffect(() => {
    // 场景进入
    const unsubEnter = gameClient.ws.on(PushMsgID.SceneEnter, (data: unknown) => {
      addSceneObject(data as any)
    })

    // 场景离开
    const unsubLeave = gameClient.ws.on(PushMsgID.SceneLeave, (data: unknown) => {
      const obj = data as { id: number }
      removeSceneObject(obj.id)
    })

    // 行军开始
    const unsubMarch = gameClient.ws.on(PushMsgID.MarchStart, (data: unknown) => {
      console.log('March started:', data)
    })

    // 战斗结束
    const unsubBattle = gameClient.ws.on(PushMsgID.BattleEnd, (data: unknown) => {
      console.log('Battle ended:', data)
      // TODO: 显示战斗报告
    })

    return () => {
      unsubEnter()
      unsubLeave()
      unsubMarch()
      unsubBattle()
    }
  }, [addSceneObject, removeSceneObject, setArmies, setActiveDialog])
}
```

- [ ] **Step 4: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 4: 通用组件

**Files:**
- Create: `src/components/common/Button.tsx`
- Create: `src/components/common/Button.css`
- Create: `src/components/common/Modal.tsx`
- Create: `src/components/common/Modal.css`

- [ ] **Step 1: 创建 src/components/common/Button.tsx**

```tsx
import './Button.css'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  fullWidth?: boolean
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: 创建 src/components/common/Button.css**

```css
.btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.btn-secondary {
  background: #2a2a4a;
  color: #ffffff;
  border: 1px solid #4a4a6a;
}

.btn-secondary:hover:not(:disabled) {
  background: #3a3a5a;
}

.btn-danger {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

/* Sizes */
.btn-small {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-medium {
  padding: 8px 20px;
  font-size: 14px;
}

.btn-large {
  padding: 12px 32px;
  font-size: 16px;
}

.btn-full {
  width: 100%;
}
```

- [ ] **Step 3: 创建 src/components/common/Modal.tsx**

```tsx
import { useEffect } from 'react'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建 src/components/common/Modal.css**

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #1a1a2e;
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #4a4a6a;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

/* Mobile */
@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    max-height: 80vh;
    margin: auto 10px;
  }
}
```

- [ ] **Step 5: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 5: 登录页面

**Files:**
- Create: `src/components/Login/LoginPage.tsx`
- Create: `src/components/Login/LoginPage.css`

- [ ] **Step 1: 创建 src/components/Login/LoginPage.tsx**

```tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/common/Button'
import { useWebSocket } from '@/api/hooks'
import { useGameStore } from '@/api/store'
import { gameClient } from '@/api/client'
import './LoginPage.css'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { connect } = useWebSocket()
  const { setLoggedIn, setRoleInfo } = useGameStore()

  useEffect(() => {
    connect()
  }, [connect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }

    setLoading(true)

    try {
      // 使用用户名作为 token 进行登录
      const response = await gameClient.api.login(username)

      if (response.code === 0) {
        setLoggedIn(true)
        if (response.data) {
          setRoleInfo(response.data as any)
        }
      } else {
        setError(response.message || '登录失败')
      }
    } catch (err) {
      setError('连接服务器失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">SLG Game</h1>

        <div className="login-tabs">
          <button
            className={`login-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError('') }}
          >
            登录
          </button>
          <button
            className={`login-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError('') }}
          >
            注册
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
              />
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          <Button
            type="submit"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 src/components/Login/LoginPage.css**

```css
.login-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.login-container {
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid #4a4a6a;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.login-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #4a4a6a;
}

.login-tab {
  flex: 1;
  background: none;
  border: none;
  color: #888;
  font-size: 16px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.login-tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.login-tab:hover:not(.active) {
  color: #aaa;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #aaa;
}

.form-group input {
  background: #2a2a4a;
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input::placeholder {
  color: #666;
}

.login-error {
  background: rgba(245, 87, 108, 0.1);
  border: 1px solid #f5576c;
  border-radius: 6px;
  padding: 12px;
  color: #f5576c;
  font-size: 14px;
  text-align: center;
}

/* Mobile */
@media (max-width: 768px) {
  .login-container {
    margin: 20px;
    padding: 24px;
  }

  .login-title {
    font-size: 24px;
  }
}
```

- [ ] **Step 3: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 6: 布局组件占位

**Files:**
- Create: `src/components/Layout/GameLayout.tsx`
- Create: `src/components/Layout/GameLayout.css`

- [ ] **Step 1: 创建 src/components/Layout/GameLayout.tsx (占位)**

```tsx
import './GameLayout.css'

export default function GameLayout() {
  return (
    <div className="game-layout">
      <div className="game-header">
        <div className="header-resources">
          <span>🌾 0</span>
          <span>🪵 0</span>
          <span>🪨 0</span>
          <span>🪙 0</span>
        </div>
      </div>
      <div className="game-main">
        <div className="game-map-placeholder">
          地图区域 (Phase 2 实现)
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 src/components/Layout/GameLayout.css**

```css
.game-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.game-header {
  height: 50px;
  background: #1a1a2e;
  border-bottom: 1px solid #4a4a6a;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.header-resources {
  display: flex;
  gap: 16px;
}

.header-resources span {
  font-size: 14px;
}

.game-main {
  flex: 1;
  display: flex;
}

.game-map-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 18px;
}
```

- [ ] **Step 3: 验证编译**

Run: `npx tsc --noEmit`

Expected: 无类型错误

- [ ] **Step 4: 提交 Phase 1**

```bash
cd /root/ai_project/p1client
git add .
git commit -m "feat: Phase 1 - 基础框架完成

- 项目初始化 (Vite + React + TypeScript)
- SDK集成 (WebSocket API)
- Zustand状态管理
- 登录页面
- 通用组件 (Button, Modal)
- 布局占位组件"
```

---

## Phase 2: 地图系统

### Task 7: 工具函数和常量

**Files:**
- Create: `src/utils/constants.ts`
- Create: `src/utils/helpers.ts`

- [ ] **Step 1: 创建 src/utils/constants.ts**

```typescript
// 地图配置
export const MAP_CONFIG = {
  width: 500,
  height: 500,
  tileSize: 1,
} as const

// 相机配置
export const CAMERA_CONFIG = {
  // 2.5D 视角
  angle: Math.PI / 6, // 30度倾斜
  minZoom: 0.5,
  maxZoom: 3,
  defaultZoom: 1,
} as const

// 颜色配置
export const COLORS = {
  // 地形
  grass: 0x3d5c3d,

  // 资源点
  food: 0x4caf50,  // 绿色
  wood: 0x8b4513,  // 棕色
  stone: 0x808080, // 灰色
  gold: 0xffd700,  // 金色

  // 阵营
  friendly: 0x2196f3, // 蓝色
  enemy: 0xf44336,    // 红色
  neutral: 0x9e9e9e,  // 灰色

  // UI
  selection: 0x00ff00,
  marchPath: 0xffff00,
} as const

// 实体类型
export const ENTITY_TYPES = {
  PLAYER: 'player',
  RESOURCE: 'resource',
  MONSTER: 'monster',
  CITY: 'city',
  BUILDING: 'building',
} as const

// 资源类型映射
export const RESOURCE_TYPE_MAP: Record<number, { name: string; color: number; icon: string }> = {
  1: { name: '粮食', color: COLORS.food, icon: '🌾' },
  2: { name: '木材', color: COLORS.wood, icon: '🪵' },
  3: { name: '石材', color: COLORS.stone, icon: '🪨' },
  4: { name: '金币', color: COLORS.gold, icon: '🪙' },
}

// 响应式断点
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const
```

- [ ] **Step 2: 创建 src/utils/helpers.ts**

```typescript
import type { Position } from '@/sdk'

/**
 * 计算两点之间的距离
 */
export function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/**
 * 格式化数字（大数字使用 K/M 后缀）
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * 格式化时间（秒转为 时:分:秒）
 */
export function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化资源
 */
export function formatResources(resources: { food: number; wood: number; stone: number; gold: number }): string {
  return `🌾${formatNumber(resources.food)} 🪵${formatNumber(resources.wood)} 🪨${formatNumber(resources.stone)} 🪙${formatNumber(resources.gold)}`
}

/**
 * 游戏坐标转Three.js坐标
 */
export function gameToThree(pos: Position, mapWidth: number, mapHeight: number): { x: number; y: number; z: number } {
  return {
    x: pos.x - mapWidth / 2,
    y: 0,
    z: pos.y - mapHeight / 2,
  }
}

/**
 * Three.js坐标转游戏坐标
 */
export function threeToGame(x: number, z: number, mapWidth: number, mapHeight: number): Position {
  return {
    x: Math.floor(x + mapWidth / 2),
    y: Math.floor(z + mapHeight / 2),
  }
}

/**
 * 计算行军时间
 */
export function calculateMarchTime(from: Position, to: Position, speed: number): number {
  const dist = distance(from, to)
  return Math.ceil((dist / speed) * 60) // 返回秒
}

/**
 * 限制数值在范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
```

- [ ] **Step 3: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 8: Three.js 场景初始化

**Files:**
- Create: `src/game/GameScene.ts`

- [ ] **Step 1: 创建 src/game/GameScene.ts**

```typescript
import * as THREE from 'three'
import { MAP_CONFIG, CAMERA_CONFIG } from '@/utils/constants'

export class GameScene {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLElement
  private animationId: number = 0
  private isRunning: boolean = false

  // 子系统
  private mapGroup: THREE.Group
  private entityGroup: THREE.Group
  private uiGroup: THREE.Group

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    // 创建相机 (2.5D 正交相机)
    const aspect = container.clientWidth / container.clientHeight
    const frustumSize = 50
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    )
    this.setupCamera()

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)

    // 创建分组
    this.mapGroup = new THREE.Group()
    this.entityGroup = new THREE.Group()
    this.uiGroup = new THREE.Group()
    this.scene.add(this.mapGroup)
    this.scene.add(this.entityGroup)
    this.scene.add(this.uiGroup)

    // 添加光源
    this.setupLights()

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private setupCamera(): void {
    // 2.5D 视角：从右上方斜视
    const distance = 100
    const angle = CAMERA_CONFIG.angle

    this.camera.position.set(
      distance * Math.cos(angle),
      distance * Math.sin(angle),
      distance * Math.cos(angle)
    )
    this.camera.lookAt(0, 0, 0)
  }

  private setupLights(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    this.scene.add(directionalLight)
  }

  private handleResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    const aspect = width / height
    const frustumSize = 50

    this.camera.left = frustumSize * aspect / -2
    this.camera.right = frustumSize * aspect / 2
    this.camera.top = frustumSize / 2
    this.camera.bottom = frustumSize / -2
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return

    this.animationId = requestAnimationFrame(this.animate)
    this.renderer.render(this.scene, this.camera)
  }

  getMapGroup(): THREE.Group {
    return this.mapGroup
  }

  getEntityGroup(): THREE.Group {
    return this.entityGroup
  }

  getUiGroup(): THREE.Group {
    return this.uiGroup
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  getContainer(): HTMLElement {
    return this.container
  }

  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize.bind(this))
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}
```

- [ ] **Step 2: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 9: 地图网格渲染

**Files:**
- Create: `src/game/MapRenderer.ts`

- [ ] **Step 1: 创建 src/game/MapRenderer.ts**

```typescript
import * as THREE from 'three'
import { MAP_CONFIG, COLORS } from '@/utils/constants'

export class MapRenderer {
  private mapGroup: THREE.Group
  private gridHelper: THREE.GridHelper | null = null
  private groundMesh: THREE.Mesh | null = null

  constructor(mapGroup: THREE.Group) {
    this.mapGroup = mapGroup
  }

  render(): void {
    this.renderGround()
    this.renderGrid()
  }

  private renderGround(): void {
    const { width, height, tileSize } = MAP_CONFIG

    // 创建地面
    const geometry = new THREE.PlaneGeometry(width * tileSize, height * tileSize)
    const material = new THREE.MeshLambertMaterial({
      color: COLORS.grass,
      side: THREE.DoubleSide,
    })

    this.groundMesh = new THREE.Mesh(geometry, material)
    this.groundMesh.rotation.x = -Math.PI / 2
    this.groundMesh.position.set(0, -0.01, 0)
    this.groundMesh.receiveShadow = true

    this.mapGroup.add(this.groundMesh)
  }

  private renderGrid(): void {
    const { width, height, tileSize } = MAP_CONFIG

    // 创建网格线
    const size = Math.max(width, height) * tileSize
    this.gridHelper = new THREE.GridHelper(size, size, 0x2a2a2a, 0x1a1a1a)
    this.gridHelper.position.set(0, 0, 0)

    this.mapGroup.add(this.gridHelper)
  }

  /**
   * 在指定位置显示地图区域指示
   */
  showAreaIndicator(x: number, y: number, radius: number = 5): THREE.Mesh {
    const geometry = new THREE.RingGeometry(radius - 0.1, radius, 32)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })

    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x - MAP_CONFIG.width / 2, 0.01, y - MAP_CONFIG.height / 2)

    this.mapGroup.add(ring)
    return ring
  }

  /**
   * 移除指示器
   */
  removeIndicator(mesh: THREE.Object3D): void {
    this.mapGroup.remove(mesh)
  }

  dispose(): void {
    if (this.gridHelper) {
      this.mapGroup.remove(this.gridHelper)
      this.gridHelper.geometry.dispose()
      ;(this.gridHelper.material as THREE.Material).dispose()
    }
    if (this.groundMesh) {
      this.mapGroup.remove(this.groundMesh)
      this.groundMesh.geometry.dispose()
      ;(this.groundMesh.material as THREE.Material).dispose()
    }
  }
}
```

- [ ] **Step 2: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 10: 相机控制器

**Files:**
- Create: `src/game/CameraController.ts`

- [ ] **Step 1: 创建 src/game/CameraController.ts**

```typescript
import * as THREE from 'three'
import { GameScene } from './GameScene'
import { CAMERA_CONFIG, MAP_CONFIG, BREAKPOINTS } from '@/utils/constants'
import { clamp } from '@/utils/helpers'

export class CameraController {
  private gameScene: GameScene
  private camera: THREE.OrthographicCamera
  private container: HTMLElement

  // 相机状态
  private zoom: number = CAMERA_CONFIG.defaultZoom
  private targetPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  private isDragging: boolean = false
  private lastPointer: { x: number; y: number } = { x: 0, y: 0 }

  // 触控状态
  private touchStartDistance: number = 0
  private lastTouchCenter: { x: number; y: number } = { x: 0, y: 0 }

  constructor(gameScene: GameScene) {
    this.gameScene = gameScene
    this.camera = gameScene.getCamera()
    this.container = gameScene.getContainer()

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // 鼠标事件
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.container.addEventListener('wheel', this.onWheel.bind(this))

    // 触控事件
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this))
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this))
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this))
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // 左键
      this.isDragging = true
      this.lastPointer = { x: event.clientX, y: event.clientY }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return

    const deltaX = event.clientX - this.lastPointer.x
    const deltaY = event.clientY - this.lastPointer.y

    // 根据相机角度计算移动方向
    const moveSpeed = 0.5 / this.zoom
    const angle = CAMERA_CONFIG.angle

    // 移动相机目标位置
    this.targetPosition.x -= (deltaX * moveSpeed * Math.cos(angle) + deltaY * moveSpeed * Math.sin(angle))
    this.targetPosition.z -= (-deltaX * moveSpeed * Math.sin(angle) + deltaY * moveSpeed * Math.cos(angle))

    this.clampPosition()
    this.updateCameraPosition()

    this.lastPointer = { x: event.clientX, y: event.clientY }
  }

  private onMouseUp(): void {
    this.isDragging = false
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault()

    const zoomDelta = event.deltaY > 0 ? 0.1 : -0.1
    this.setZoom(this.zoom + zoomDelta)
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault()

    if (event.touches.length === 1) {
      // 单指拖动
      this.isDragging = true
      this.lastPointer = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }
    } else if (event.touches.length === 2) {
      // 双指缩放
      this.isDragging = false
      this.touchStartDistance = this.getTouchDistance(event.touches)
      this.lastTouchCenter = this.getTouchCenter(event.touches)
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault()

    if (event.touches.length === 1 && this.isDragging) {
      // 单指拖动
      const deltaX = event.touches[0].clientX - this.lastPointer.x
      const deltaY = event.touches[0].clientY - this.lastPointer.y

      const moveSpeed = 0.5 / this.zoom
      const angle = CAMERA_CONFIG.angle

      this.targetPosition.x -= (deltaX * moveSpeed * Math.cos(angle) + deltaY * moveSpeed * Math.sin(angle))
      this.targetPosition.z -= (-deltaX * moveSpeed * Math.sin(angle) + deltaY * moveSpeed * Math.cos(angle))

      this.clampPosition()
      this.updateCameraPosition()

      this.lastPointer = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }
    } else if (event.touches.length === 2) {
      // 双指缩放
      const currentDistance = this.getTouchDistance(event.touches)
      const scale = currentDistance / this.touchStartDistance

      this.setZoom(this.zoom / scale)
      this.touchStartDistance = currentDistance

      // 双指平移
      const currentCenter = this.getTouchCenter(event.touches)
      const deltaX = currentCenter.x - this.lastTouchCenter.x
      const deltaY = currentCenter.y - this.lastTouchCenter.y

      const moveSpeed = 0.3 / this.zoom
      const angle = CAMERA_CONFIG.angle

      this.targetPosition.x -= (deltaX * moveSpeed * Math.cos(angle) + deltaY * moveSpeed * Math.sin(angle))
      this.targetPosition.z -= (-deltaX * moveSpeed * Math.sin(angle) + deltaY * moveSpeed * Math.cos(angle))

      this.clampPosition()
      this.updateCameraPosition()

      this.lastTouchCenter = currentCenter
    }
  }

  private onTouchEnd(): void {
    this.isDragging = false
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  private getTouchCenter(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }

  private clampPosition(): void {
    const halfWidth = (MAP_CONFIG.width * MAP_CONFIG.tileSize) / 2
    const halfHeight = (MAP_CONFIG.height * MAP_CONFIG.tileSize) / 2

    this.targetPosition.x = clamp(this.targetPosition.x, -halfWidth, halfWidth)
    this.targetPosition.z = clamp(this.targetPosition.z, -halfHeight, halfHeight)
  }

  private updateCameraPosition(): void {
    const distance = 100
    const angle = CAMERA_CONFIG.angle

    this.camera.position.set(
      this.targetPosition.x + distance * Math.cos(angle),
      distance * Math.sin(angle),
      this.targetPosition.z + distance * Math.cos(angle)
    )
    this.camera.lookAt(this.targetPosition)
  }

  setZoom(zoom: number): void {
    this.zoom = clamp(zoom, CAMERA_CONFIG.minZoom, CAMERA_CONFIG.maxZoom)
    this.camera.zoom = this.zoom
    this.camera.updateProjectionMatrix()
  }

  getZoom(): number {
    return this.zoom
  }

  /**
   * 聚焦到指定位置
   */
  focusOn(x: number, z: number): void {
    this.targetPosition.set(x, 0, z)
    this.clampPosition()
    this.updateCameraPosition()
  }

  /**
   * 获取当前相机中心对应的游戏坐标
   */
  getCenterGamePosition(): { x: number; y: number } {
    return {
      x: Math.floor(this.targetPosition.x + MAP_CONFIG.width / 2),
      y: Math.floor(this.targetPosition.z + MAP_CONFIG.height / 2),
    }
  }

  dispose(): void {
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this))
    this.container.removeEventListener('mousemove', this.onMouseMove.bind(this))
    this.container.removeEventListener('mouseup', this.onMouseUp.bind(this))
    this.container.removeEventListener('wheel', this.onWheel.bind(this))
    this.container.removeEventListener('touchstart', this.onTouchStart.bind(this))
    this.container.removeEventListener('touchmove', this.onTouchMove.bind(this))
    this.container.removeEventListener('touchend', this.onTouchEnd.bind(this))
  }
}
```

- [ ] **Step 2: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 11: GameCanvas 组件集成

**Files:**
- Create: `src/components/Map/GameCanvas.tsx`
- Create: `src/components/Map/GameCanvas.css`
- Modify: `src/components/Layout/GameLayout.tsx`

- [ ] **Step 1: 创建 src/components/Map/GameCanvas.tsx**

```tsx
import { useEffect, useRef } from 'react'
import { GameScene } from '@/game/GameScene'
import { MapRenderer } from '@/game/MapRenderer'
import { CameraController } from '@/game/CameraController'
import './GameCanvas.css'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<{
    scene: GameScene
    mapRenderer: MapRenderer
    cameraController: CameraController
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    // 初始化游戏场景
    const scene = new GameScene(containerRef.current)
    const mapRenderer = new MapRenderer(scene.getMapGroup())
    const cameraController = new CameraController(scene)

    // 渲染地图
    mapRenderer.render()

    // 启动渲染循环
    scene.start()

    gameRef.current = {
      scene,
      mapRenderer,
      cameraController,
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.cameraController.dispose()
        gameRef.current.mapRenderer.dispose()
        gameRef.current.scene.dispose()
        gameRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} className="game-canvas" />
}
```

- [ ] **Step 2: 创建 src/components/Map/GameCanvas.css**

```css
.game-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.game-canvas canvas {
  display: block;
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 3: 更新 src/components/Layout/GameLayout.tsx**

```tsx
import { useGameStore } from '@/api/store'
import GameCanvas from '@/components/Map/GameCanvas'
import './GameLayout.css'

export default function GameLayout() {
  const { roleInfo } = useGameStore()

  const resources = roleInfo?.resources || { food: 0, wood: 0, stone: 0, gold: 0 }

  return (
    <div className="game-layout">
      <div className="game-header">
        <div className="header-resources">
          <span>🌾 {resources.food}</span>
          <span>🪵 {resources.wood}</span>
          <span>🪨 {resources.stone}</span>
          <span>🪙 {resources.gold}</span>
        </div>
        <div className="header-info">
          <span>Lv.{roleInfo?.level || 1}</span>
          <span>{roleInfo?.name || '玩家'}</span>
        </div>
      </div>
      <div className="game-main">
        <GameCanvas />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 更新 src/components/Layout/GameLayout.css**

```css
.game-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.game-header {
  height: 50px;
  background: #1a1a2e;
  border-bottom: 1px solid #4a4a6a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 10;
}

.header-resources {
  display: flex;
  gap: 16px;
}

.header-resources span {
  font-size: 14px;
}

.header-info {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #aaa;
}

.game-main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Mobile */
@media (max-width: 768px) {
  .game-header {
    height: 44px;
    padding: 0 12px;
  }

  .header-resources {
    gap: 10px;
  }

  .header-resources span {
    font-size: 12px;
  }

  .header-info {
    display: none;
  }
}
```

- [ ] **Step 5: 验证编译和运行**

Run: `npx tsc --noEmit`

Expected: 无类型错误

Run: `npm run dev`

Expected: 开发服务器启动，可以看到地图渲染

- [ ] **Step 6: 提交 Phase 2**

```bash
cd /root/ai_project/p1client
git add .
git commit -m "feat: Phase 2 - 地图系统完成

- 工具函数和常量
- Three.js 场景初始化
- 地图网格渲染
- 相机控制器 (鼠标+触控)
- GameCanvas 组件集成"
```

---

## Phase 3: 核心功能

### Task 12: 实体渲染器

**Files:**
- Create: `src/game/EntityRenderer.ts`

- [ ] **Step 1: 创建 src/game/EntityRenderer.ts**

```typescript
import * as THREE from 'three'
import { COLORS, RESOURCE_TYPE_MAP, MAP_CONFIG } from '@/utils/constants'
import { gameToThree } from '@/utils/helpers'
import type { SceneObject, EntityType, ResourceType } from '@/sdk'

interface EntityMesh extends THREE.Mesh {
  userData: {
    entityId: number
    entityType: EntityType
    entityData: SceneObject
  }
}

export class EntityRenderer {
  private entityGroup: THREE.Group
  private entities: Map<number, EntityMesh> = new Map()

  constructor(entityGroup: THREE.Group) {
    this.entityGroup = entityGroup
  }

  /**
   * 添加场景实体
   */
  addEntity(entity: SceneObject): EntityMesh {
    // 如果已存在，先移除
    if (this.entities.has(entity.id)) {
      this.removeEntity(entity.id)
    }

    let mesh: EntityMesh

    switch (entity.type) {
      case 'resource':
        mesh = this.createResourceMesh(entity)
        break
      case 'city':
        mesh = this.createCityMesh(entity)
        break
      case 'player':
        mesh = this.createPlayerMesh(entity)
        break
      default:
        mesh = this.createDefaultMesh(entity)
    }

    // 设置位置
    const pos = gameToThree(entity.position, MAP_CONFIG.width, MAP_CONFIG.height)
    mesh.position.set(pos.x, pos.y, pos.z)

    // 存储实体数据
    mesh.userData = {
      entityId: entity.id,
      entityType: entity.type,
      entityData: entity,
    }

    this.entities.set(entity.id, mesh)
    this.entityGroup.add(mesh)

    return mesh
  }

  private createResourceMesh(entity: SceneObject): EntityMesh {
    const resourceType = entity.resourceType as number
    const config = RESOURCE_TYPE_MAP[resourceType] || RESOURCE_TYPE_MAP[1]

    // 创建资源点方块
    const geometry = new THREE.BoxGeometry(0.8, 0.4, 0.8)
    const material = new THREE.MeshLambertMaterial({
      color: config.color,
    })

    const mesh = new THREE.Mesh(geometry, material) as EntityMesh
    mesh.position.y = 0.2

    return mesh
  }

  private createCityMesh(entity: SceneObject): EntityMesh {
    // 创建城池（简单的城墙形状）
    const group = new THREE.Group()

    // 底座
    const baseGeometry = new THREE.BoxGeometry(3, 0.5, 3)
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.25
    group.add(base)

    // 城墙
    const wallGeometry = new THREE.BoxGeometry(2.5, 1.5, 0.3)
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x6b5344 })

    // 四面墙
    const positions = [
      { x: 0, z: 1.1, rot: 0 },
      { x: 0, z: -1.1, rot: 0 },
      { x: 1.1, z: 0, rot: Math.PI / 2 },
      { x: -1.1, z: 0, rot: Math.PI / 2 },
    ]

    positions.forEach((pos) => {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial)
      wall.position.set(pos.x, 1.25, pos.z)
      wall.rotation.y = pos.rot
      group.add(wall)
    })

    // 塔楼
    const towerGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8)
    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
    const towerPositions = [
      { x: 1.2, z: 1.2 },
      { x: -1.2, z: 1.2 },
      { x: 1.2, z: -1.2 },
      { x: -1.2, z: -1.2 },
    ]

    towerPositions.forEach((pos) => {
      const tower = new THREE.Mesh(towerGeometry, towerMaterial)
      tower.position.set(pos.x, 1.5, pos.z)
      group.add(tower)
    })

    // 合并为单个mesh
    const mergedGeometry = new THREE.BufferGeometry()
    const meshes: THREE.Mesh[] = []
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child)
      }
    })

    // 使用Group作为返回值，但转换为Mesh类型
    const container = new THREE.Mesh() as EntityMesh
    container.add(...group.children)

    return container
  }

  private createPlayerMesh(entity: SceneObject): EntityMesh {
    // 创建玩家单位（旗帜形状）
    const geometry = new THREE.ConeGeometry(0.3, 1, 4)
    const material = new THREE.MeshLambertMaterial({
      color: COLORS.friendly,
    })

    const mesh = new THREE.Mesh(geometry, material) as EntityMesh
    mesh.position.y = 0.5
    mesh.rotation.y = Math.PI / 4

    return mesh
  }

  private createDefaultMesh(entity: SceneObject): EntityMesh {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16)
    const material = new THREE.MeshLambertMaterial({
      color: COLORS.neutral,
    })

    const mesh = new THREE.Mesh(geometry, material) as EntityMesh
    mesh.position.y = 0.5

    return mesh
  }

  /**
   * 移除实体
   */
  removeEntity(entityId: number): void {
    const mesh = this.entities.get(entityId)
    if (mesh) {
      this.entityGroup.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      this.entities.delete(entityId)
    }
  }

  /**
   * 更新实体位置
   */
  updateEntityPosition(entityId: number, position: { x: number; y: number }): void {
    const mesh = this.entities.get(entityId)
    if (mesh) {
      const pos = gameToThree(position, MAP_CONFIG.width, MAP_CONFIG.height)
      mesh.position.x = pos.x
      mesh.position.z = pos.z
    }
  }

  /**
   * 获取实体
   */
  getEntity(entityId: number): EntityMesh | undefined {
    return this.entities.get(entityId)
  }

  /**
   * 获取所有实体
   */
  getAllEntities(): Map<number, EntityMesh> {
    return this.entities
  }

  /**
   * 高亮实体
   */
  highlightEntity(entityId: number, highlight: boolean): void {
    const mesh = this.entities.get(entityId)
    if (mesh) {
      if (highlight) {
        mesh.scale.set(1.2, 1.2, 1.2)
      } else {
        mesh.scale.set(1, 1, 1)
      }
    }
  }

  /**
   * 清除所有实体
   */
  clear(): void {
    this.entities.forEach((mesh, id) => {
      this.removeEntity(id)
    })
  }

  dispose(): void {
    this.clear()
  }
}
```

- [ ] **Step 2: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 13: 选择管理器

**Files:**
- Create: `src/game/SelectionManager.ts`

- [ ] **Step 1: 创建 src/game/SelectionManager.ts**

```typescript
import * as THREE from 'three'
import { GameScene } from './GameScene'
import { EntityRenderer } from './EntityRenderer'
import { MAP_CONFIG, COLORS } from '@/utils/constants'
import { threeToGame } from '@/utils/helpers'
import type { SceneObject } from '@/sdk'

type SelectionCallback = (entity: SceneObject | null) => void

export class SelectionManager {
  private gameScene: GameScene
  private entityRenderer: EntityRenderer
  private renderer: THREE.WebGLRenderer
  private camera: THREE.Camera
  private container: HTMLElement

  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private selectedEntityId: number | null = null
  private selectionCallbacks: SelectionCallback[] = []

  constructor(
    gameScene: GameScene,
    entityRenderer: EntityRenderer
  ) {
    this.gameScene = gameScene
    this.entityRenderer = entityRenderer
    this.renderer = gameScene.getRenderer()
    this.camera = gameScene.getCamera()
    this.container = gameScene.getContainer()

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', this.onClick.bind(this))
  }

  private onClick(event: MouseEvent): void {
    // 计算鼠标位置
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 射线检测
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const entities = this.entityRenderer.getAllEntities()
    const meshes: THREE.Object3D[] = []
    entities.forEach((mesh) => {
      meshes.push(mesh)
    })

    const intersects = this.raycaster.intersectObjects(meshes, true)

    if (intersects.length > 0) {
      // 找到最近的实体
      let targetMesh = intersects[0].object

      // 向上遍历找到带有userData的父级
      while (targetMesh && !targetMesh.userData?.entityId) {
        targetMesh = targetMesh.parent as THREE.Object3D
      }

      if (targetMesh?.userData?.entityId) {
        this.selectEntity(targetMesh.userData.entityId)
        return
      }
    }

    // 点击空白处，取消选择
    this.clearSelection()
  }

  selectEntity(entityId: number): void {
    // 取消之前的选择
    if (this.selectedEntityId !== null) {
      this.entityRenderer.highlightEntity(this.selectedEntityId, false)
    }

    // 高亮新选择的实体
    this.selectedEntityId = entityId
    this.entityRenderer.highlightEntity(entityId, true)

    // 通知回调
    const entity = this.entityRenderer.getEntity(entityId)
    if (entity) {
      const entityData = entity.userData.entityData
      this.selectionCallbacks.forEach((cb) => cb(entityData))
    }
  }

  clearSelection(): void {
    if (this.selectedEntityId !== null) {
      this.entityRenderer.highlightEntity(this.selectedEntityId, false)
      this.selectedEntityId = null
    }

    // 通知回调
    this.selectionCallbacks.forEach((cb) => cb(null))
  }

  getSelectedEntity(): SceneObject | null {
    if (this.selectedEntityId === null) return null

    const mesh = this.entityRenderer.getEntity(this.selectedEntityId)
    return mesh?.userData.entityData || null
  }

  onSelectionChange(callback: SelectionCallback): () => void {
    this.selectionCallbacks.push(callback)

    // 返回取消订阅函数
    return () => {
      const index = this.selectionCallbacks.indexOf(callback)
      if (index > -1) {
        this.selectionCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 获取点击位置的游戏坐标
   */
  getClickGamePosition(event: MouseEvent): { x: number; y: number } | null {
    const rect = this.container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )

    this.raycaster.setFromCamera(mouse, this.camera)

    // 检测与地面的交点
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersection = new THREE.Vector3()

    if (this.raycaster.ray.intersectPlane(plane, intersection)) {
      return threeToGame(intersection.x, intersection.z, MAP_CONFIG.width, MAP_CONFIG.height)
    }

    return null
  }

  dispose(): void {
    this.container.removeEventListener('click', this.onClick.bind(this))
    this.selectionCallbacks = []
  }
}
```

- [ ] **Step 2: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 14: 响应式Hook

**Files:**
- Create: `src/hooks/useResponsive.ts`

- [ ] **Step 1: 创建 src/hooks/useResponsive.ts**

```typescript
import { useState, useEffect } from 'react'
import { BREAKPOINTS } from '@/utils/constants'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

interface ResponsiveInfo {
  device: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
}

export function useResponsive(): ResponsiveInfo {
  const [info, setInfo] = useState<ResponsiveInfo>(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    return getResponsiveInfo(width, height)
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setInfo(getResponsiveInfo(width, height))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return info
}

function getResponsiveInfo(width: number, height: number): ResponsiveInfo {
  let device: DeviceType = 'desktop'

  if (width < BREAKPOINTS.mobile) {
    device = 'mobile'
  } else if (width < BREAKPOINTS.tablet) {
    device = 'tablet'
  } else {
    device = 'desktop'
  }

  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    width,
    height,
  }
}
```

- [ ] **Step 2: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 15: 侧边面板和底部导航

**Files:**
- Create: `src/components/Layout/SidePanel.tsx`
- Create: `src/components/Layout/SidePanel.css`
- Create: `src/components/Layout/BottomNav.tsx`
- Create: `src/components/Layout/BottomNav.css`
- Modify: `src/components/Layout/GameLayout.tsx`
- Modify: `src/components/Layout/GameLayout.css`

- [ ] **Step 1: 创建 src/components/Layout/SidePanel.tsx**

```tsx
import { Button } from '@/components/common/Button'
import { useGameStore } from '@/api/store'
import './SidePanel.css'

export default function SidePanel() {
  const { setActiveDialog, armies, soldiers } = useGameStore()

  const totalSoldiers = soldiers.reduce((sum, s) => sum + s.count, 0)
  const totalWounded = soldiers.reduce((sum, s) => sum + s.wounded, 0)

  return (
    <div className="side-panel">
      <div className="panel-section">
        <h3 className="panel-title">快捷操作</h3>
        <div className="panel-buttons">
          <Button
            variant="secondary"
            onClick={() => setActiveDialog('army')}
          >
            我的军队 ({armies.length})
          </Button>
          <Button
            variant="secondary"
            onClick={() => setActiveDialog('soldier')}
          >
            训练士兵
          </Button>
          <Button
            variant="secondary"
            onClick={() => setActiveDialog('heal')}
            disabled={totalWounded === 0}
          >
            伤兵营 ({totalWounded})
          </Button>
        </div>
      </div>

      <div className="panel-section">
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
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 src/components/Layout/SidePanel.css**

```css
.side-panel {
  width: 240px;
  background: #1a1a2e;
  border-left: 1px solid #4a4a6a;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid #4a4a6a;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #888;
  margin-bottom: 12px;
}

.panel-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-row .wounded {
  color: #f5576c;
}
```

- [ ] **Step 3: 创建 src/components/Layout/BottomNav.tsx**

```tsx
import { useGameStore } from '@/api/store'
import './BottomNav.css'

export default function BottomNav() {
  const { activeTab, setActiveTab, armies, soldiers } = useGameStore()

  const totalWounded = soldiers.reduce((sum, s) => sum + s.wounded, 0)

  const tabs = [
    { id: 'map' as const, label: '地图', icon: '🗺️' },
    { id: 'army' as const, label: '军队', icon: '⚔️', badge: armies.length },
    { id: 'soldier' as const, label: '士兵', icon: '🛡️', badge: totalWounded > 0 ? totalWounded : undefined },
    { id: 'item' as const, label: '物品', icon: '🎒' },
  ]

  return (
    <div className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="nav-badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 创建 src/components/Layout/BottomNav.css**

```css
.bottom-nav {
  height: 60px;
  background: #1a1a2e;
  border-top: 1px solid #4a4a6a;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #888;
  padding: 8px 16px;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.nav-item.active {
  color: #667eea;
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 11px;
}

.nav-badge {
  position: absolute;
  top: 2px;
  right: 8px;
  background: #f5576c;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}
```

- [ ] **Step 5: 更新 src/components/Layout/GameLayout.tsx**

```tsx
import { useGameStore } from '@/api/store'
import { useResponsive } from '@/hooks/useResponsive'
import GameCanvas from '@/components/Map/GameCanvas'
import SidePanel from '@/components/Layout/SidePanel'
import BottomNav from '@/components/Layout/BottomNav'
import './GameLayout.css'

export default function GameLayout() {
  const { roleInfo } = useGameStore()
  const { isMobile } = useResponsive()

  const resources = roleInfo?.resources || { food: 0, wood: 0, stone: 0, gold: 0 }

  return (
    <div className="game-layout">
      <div className="game-header">
        <div className="header-resources">
          <span>🌾 {resources.food}</span>
          <span>🪵 {resources.wood}</span>
          <span>🪨 {resources.stone}</span>
          <span>🪙 {resources.gold}</span>
        </div>
        <div className="header-info">
          <span>Lv.{roleInfo?.level || 1}</span>
          <span>{roleInfo?.name || '玩家'}</span>
        </div>
      </div>

      <div className="game-main">
        <GameCanvas />
        {!isMobile && <SidePanel />}
      </div>

      {isMobile && <BottomNav />}
    </div>
  )
}
```

- [ ] **Step 6: 更新 src/components/Layout/GameLayout.css**

在文件末尾添加：

```css
/* Mobile */
@media (max-width: 768px) {
  .game-layout {
    padding-bottom: 60px;
  }

  .game-header {
    height: 44px;
    padding: 0 12px;
  }

  .header-resources {
    gap: 10px;
  }

  .header-resources span {
    font-size: 12px;
  }

  .header-info {
    display: none;
  }
}
```

- [ ] **Step 7: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

- [ ] **Step 8: 提交 Phase 3**

```bash
cd /root/ai_project/p1client
git add .
git commit -m "feat: Phase 3 - 核心功能完成

- 实体渲染器 (资源点、城池、玩家)
- 选择管理器 (射线检测、高亮)
- 响应式Hook
- 侧边面板 (桌面端)
- 底部导航 (移动端)"
```

---

## Phase 4: 交互完善

### Task 16: 军队弹窗组件

**Files:**
- Create: `src/components/dialogs/ArmyDialog.tsx`
- Create: `src/components/dialogs/ArmyDialog.css`

- [ ] **Step 1: 创建 src/components/dialogs/ArmyDialog.tsx**

```tsx
import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useGameStore } from '@/api/store'
import { gameClient } from '@/api/client'
import { MsgID } from '@/sdk'
import { formatNumber } from '@/utils/helpers'
import type { ArmyData, SoldierData } from '@/sdk'
import './ArmyDialog.css'

interface ArmyDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function ArmyDialog({ isOpen, onClose }: ArmyDialogProps) {
  const { armies, soldiers, roleInfo } = useGameStore()
  const [selectedArmy, setSelectedArmy] = useState<ArmyData | null>(null)
  const [loading, setLoading] = useState(false)

  // 创建军队相关状态
  const [showCreate, setShowCreate] = useState(false)
  const [selectedSoldiers, setSelectedSoldiers] = useState<Record<number, number>>({})

  const handleCreateArmy = async () => {
    if (!roleInfo?.position) return

    const soldierList = Object.entries(selectedSoldiers)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => ({ soldierId: Number(id), count }))

    if (soldierList.length === 0) {
      alert('请选择至少一个士兵')
      return
    }

    setLoading(true)
    try {
      const response = await gameClient.api.createArmy(
        0, // heroId, 暂时为0
        selectedSoldiers,
        1, // sceneId
        roleInfo.position.x,
        roleInfo.position.y
      )

      if (response.code === 0) {
        setShowCreate(false)
        setSelectedSoldiers({})
        // 刷新军队列表
        await gameClient.api.getArmies()
      } else {
        alert(response.message || '创建失败')
      }
    } catch (error) {
      alert('创建军队失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArmy = async (armyId: number) => {
    if (!confirm('确定要解散这支军队吗？')) return

    setLoading(true)
    try {
      const response = await gameClient.api.deleteArmy(armyId)
      if (response.code === 0) {
        setSelectedArmy(null)
      } else {
        alert(response.message || '解散失败')
      }
    } catch (error) {
      alert('解散军队失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSoldierChange = (soldierId: number, count: number) => {
    setSelectedSoldiers((prev) => ({
      ...prev,
      [soldierId]: Math.max(0, count),
    }))
  }

  const getTotalPower = () => {
    // 简单计算总战力
    return Object.entries(selectedSoldiers)
      .reduce((sum, [id, count]) => sum + count * 100, 0)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="我的军队">
      <div className="army-dialog">
        {!showCreate ? (
          <>
            <div className="dialog-header">
              <span>军队列表 ({armies.length})</span>
              <Button size="small" onClick={() => setShowCreate(true)}>
                创建军队
              </Button>
            </div>

            <div className="army-list">
              {armies.length === 0 ? (
                <div className="empty-tip">暂无军队，点击上方按钮创建</div>
              ) : (
                armies.map((army) => (
                  <div
                    key={army.id}
                    className={`army-item ${selectedArmy?.id === army.id ? 'selected' : ''}`}
                    onClick={() => setSelectedArmy(army)}
                  >
                    <div className="army-info">
                      <span className="army-id">军队 #{army.id}</span>
                      <span className="army-status">{army.status}</span>
                    </div>
                    <div className="army-soldiers">
                      {Object.entries(army.soldiers).map(([id, count]) => (
                        <span key={id}>{id}: {count}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedArmy && (
              <div className="army-actions">
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteArmy(selectedArmy.id)}
                  disabled={loading || selectedArmy.status !== 'idle'}
                >
                  解散军队
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="dialog-header">
              <span>创建军队</span>
              <Button size="small" variant="secondary" onClick={() => setShowCreate(false)}>
                返回
              </Button>
            </div>

            <div className="soldier-select">
              <div className="select-title">选择士兵</div>
              {soldiers.map((soldier) => (
                <div key={soldier.id} className="soldier-row">
                  <div className="soldier-info">
                    <span className="soldier-name">士兵 Lv.{soldier.level}</span>
                    <span className="soldier-count">可用: {soldier.count}</span>
                  </div>
                  <div className="soldier-input">
                    <button
                      onClick={() => handleSoldierChange(soldier.id, (selectedSoldiers[soldier.id] || 0) - 1)}
                      disabled={(selectedSoldiers[soldier.id] || 0) <= 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={selectedSoldiers[soldier.id] || 0}
                      onChange={(e) => handleSoldierChange(soldier.id, parseInt(e.target.value) || 0)}
                      min={0}
                      max={soldier.count}
                    />
                    <button
                      onClick={() => handleSoldierChange(soldier.id, (selectedSoldiers[soldier.id] || 0) + 1)}
                      disabled={(selectedSoldiers[soldier.id] || 0) >= soldier.count}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="create-summary">
              <div className="summary-row">
                <span>总战力</span>
                <span>{formatNumber(getTotalPower())}</span>
              </div>
            </div>

            <div className="create-actions">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                取消
              </Button>
              <Button onClick={handleCreateArmy} disabled={loading}>
                {loading ? '创建中...' : '确认创建'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: 创建 src/components/dialogs/ArmyDialog.css**

```css
.army-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.army-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.army-item {
  background: #2a2a4a;
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.army-item:hover {
  border-color: #667eea;
}

.army-item.selected {
  border-color: #667eea;
  background: #3a3a5a;
}

.army-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.army-id {
  font-weight: 500;
}

.army-status {
  color: #888;
  font-size: 12px;
}

.army-soldiers {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #aaa;
}

.army-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #4a4a6a;
}

.empty-tip {
  text-align: center;
  color: #666;
  padding: 20px;
}

.soldier-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-title {
  font-size: 14px;
  color: #888;
}

.soldier-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2a2a4a;
  border-radius: 6px;
  padding: 8px 12px;
}

.soldier-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.soldier-name {
  font-size: 14px;
}

.soldier-count {
  font-size: 12px;
  color: #888;
}

.soldier-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.soldier-input button {
  width: 28px;
  height: 28px;
  border: 1px solid #4a4a6a;
  background: #3a3a5a;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.soldier-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.soldier-input input {
  width: 60px;
  text-align: center;
  background: #1a1a2e;
  border: 1px solid #4a4a6a;
  border-radius: 4px;
  color: #fff;
  padding: 4px;
}

.create-summary {
  background: #2a2a4a;
  border-radius: 6px;
  padding: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```

- [ ] **Step 3: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 17: 士兵训练弹窗

**Files:**
- Create: `src/components/dialogs/SoldierDialog.tsx`
- Create: `src/components/dialogs/SoldierDialog.css`

- [ ] **Step 1: 创建 src/components/dialogs/SoldierDialog.tsx**

```tsx
import { useState, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useGameStore } from '@/api/store'
import { gameClient } from '@/api/client'
import { soldierConfig, SoldierConfig } from '@/sdk'
import { formatNumber, formatTime } from '@/utils/helpers'
import './SoldierDialog.css'

interface SoldierDialogProps {
  isOpen: boolean
  onClose: () => void
}

const SOLDIER_TYPES = [
  { id: 1, name: '步兵', icon: '🗡️', desc: '高防御，近战主力' },
  { id: 2, name: '骑兵', icon: '🐎', desc: '高机动，快速突击' },
  { id: 3, name: '弓兵', icon: '🏹', desc: '高攻击，远程输出' },
  { id: 4, name: '攻城', icon: '🏰', desc: '攻城利器，高负重' },
]

export default function SoldierDialog({ isOpen, onClose }: SoldierDialogProps) {
  const { soldiers, trainQueue, roleInfo } = useGameStore()

  const [selectedType, setSelectedType] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [trainCount, setTrainCount] = useState(100)
  const [loading, setLoading] = useState(false)

  // 获取当前类型和等级的士兵配置
  const getCurrentConfig = (): SoldierConfig | null => {
    const configs = soldierConfig.soldiers
    const soldierId = selectedType * 100 + selectedLevel
    return configs.find((s) => s.id === soldierId) || null
  }

  const config = getCurrentConfig()

  // 计算训练消耗
  const getTrainCost = () => {
    if (!config) return null
    return {
      food: config.costFood * trainCount,
      wood: config.costWood * trainCount,
      stone: config.costStone * trainCount,
      gold: config.costGold * trainCount,
    }
  }

  // 计算训练时间
  const getTrainTime = () => {
    if (!config) return 0
    return config.trainTime * trainCount
  }

  // 检查资源是否足够
  const canAfford = () => {
    const cost = getTrainCost()
    if (!cost || !roleInfo?.resources) return false

    return (
      cost.food <= roleInfo.resources.food &&
      cost.wood <= roleInfo.resources.wood &&
      cost.stone <= roleInfo.resources.stone &&
      cost.gold <= roleInfo.resources.gold
    )
  }

  const handleTrain = async () => {
    if (!canAfford()) {
      alert('资源不足')
      return
    }

    setLoading(true)
    try {
      const response = await gameClient.api.trainSoldier(
        selectedType,
        selectedLevel,
        trainCount
      )

      if (response.code === 0) {
        // 刷新训练队列
        await gameClient.api.getTrainQueue()
        setTrainCount(100)
      } else {
        alert(response.message || '训练失败')
      }
    } catch (error) {
      alert('训练请求失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteTrain = async () => {
    setLoading(true)
    try {
      await gameClient.api.completeTrain()
      await gameClient.api.getTrainQueue()
    } catch (error) {
      console.error('完成训练失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const cost = getTrainCost()
  const trainTime = getTrainTime()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="士兵训练">
      <div className="soldier-dialog">
        {/* 兵种选择 */}
        <div className="type-selector">
          {SOLDIER_TYPES.map((type) => (
            <button
              key={type.id}
              className={`type-btn ${selectedType === type.id ? 'active' : ''}`}
              onClick={() => setSelectedType(type.id)}
            >
              <span className="type-icon">{type.icon}</span>
              <span className="type-name">{type.name}</span>
            </button>
          ))}
        </div>

        {/* 等级选择 */}
        <div className="level-selector">
          <span className="label">等级</span>
          <div className="level-btns">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                className={`level-btn ${selectedLevel === level ? 'active' : ''}`}
                onClick={() => setSelectedLevel(level)}
              >
                Lv.{level}
              </button>
            ))}
          </div>
        </div>

        {/* 士兵信息 */}
        {config && (
          <div className="soldier-info">
            <div className="info-header">
              <span className="info-name">{config.name}</span>
              <span className="info-power">战力: {config.power}</span>
            </div>
            <div className="info-stats">
              <span>攻击: {config.attack}</span>
              <span>防御: {config.defense}</span>
              <span>生命: {config.hp}</span>
              <span>速度: {config.speed}</span>
            </div>
          </div>
        )}

        {/* 训练数量 */}
        <div className="train-count">
          <span className="label">训练数量</span>
          <div className="count-input">
            <button onClick={() => setTrainCount(Math.max(1, trainCount - 100))}>-100</button>
            <input
              type="number"
              value={trainCount}
              onChange={(e) => setTrainCount(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <button onClick={() => setTrainCount(trainCount + 100)}>+100</button>
          </div>
        </div>

        {/* 训练消耗 */}
        {cost && (
          <div className="train-cost">
            <div className="cost-title">消耗资源</div>
            <div className="cost-items">
              <span className={cost.food > (roleInfo?.resources.food || 0) ? 'insufficient' : ''}>
                🌾 {formatNumber(cost.food)}
              </span>
              <span className={cost.wood > (roleInfo?.resources.wood || 0) ? 'insufficient' : ''}>
                🪵 {formatNumber(cost.wood)}
              </span>
              <span className={cost.stone > (roleInfo?.resources.stone || 0) ? 'insufficient' : ''}>
                🪨 {formatNumber(cost.stone)}
              </span>
              <span className={cost.gold > (roleInfo?.resources.gold || 0) ? 'insufficient' : ''}>
                🪙 {formatNumber(cost.gold)}
              </span>
            </div>
            <div className="train-time">训练时间: {formatTime(trainTime)}</div>
          </div>
        )}

        {/* 训练按钮 */}
        <Button
          fullWidth
          onClick={handleTrain}
          disabled={loading || !canAfford() || trainQueue.length >= 2}
        >
          {trainQueue.length >= 2 ? '队列已满' : loading ? '训练中...' : '开始训练'}
        </Button>

        {/* 训练队列 */}
        {trainQueue.length > 0 && (
          <div className="train-queue">
            <div className="queue-title">训练队列 ({trainQueue.length}/2)</div>
            {trainQueue.map((item) => (
              <div key={item.id} className="queue-item">
                <div className="queue-info">
                  <span>士兵 Lv.{item.level} × {item.count}</span>
                  <span className="queue-time">
                    {formatTime(Math.max(0, (item.finishTime - Date.now()) / 1000))}
                  </span>
                </div>
                <Button size="small" variant="secondary" onClick={handleCompleteTrain}>
                  完成
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: 创建 src/components/dialogs/SoldierDialog.css**

```css
.soldier-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #2a2a4a;
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn:hover {
  border-color: #667eea;
}

.type-btn.active {
  border-color: #667eea;
  background: #3a3a5a;
}

.type-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.type-name {
  font-size: 12px;
}

.level-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  font-size: 14px;
  color: #888;
  min-width: 60px;
}

.level-btns {
  display: flex;
  gap: 8px;
  flex: 1;
}

.level-btn {
  flex: 1;
  padding: 8px;
  background: #2a2a4a;
  border: 1px solid #4a4a6a;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.level-btn:hover {
  border-color: #667eea;
}

.level-btn.active {
  border-color: #667eea;
  background: #667eea;
}

.soldier-info {
  background: #2a2a4a;
  border-radius: 6px;
  padding: 12px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-name {
  font-weight: 500;
}

.info-power {
  color: #ffd700;
}

.info-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #aaa;
}

.train-count {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-input {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.count-input button {
  padding: 8px 12px;
  background: #2a2a4a;
  border: 1px solid #4a4a6a;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
}

.count-input input {
  flex: 1;
  text-align: center;
  padding: 8px;
  background: #1a1a2e;
  border: 1px solid #4a4a6a;
  border-radius: 4px;
  color: #fff;
}

.train-cost {
  background: #2a2a4a;
  border-radius: 6px;
  padding: 12px;
}

.cost-title {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.cost-items {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.cost-items .insufficient {
  color: #f5576c;
}

.train-time {
  font-size: 12px;
  color: #aaa;
}

.train-queue {
  border-top: 1px solid #4a4a6a;
  padding-top: 12px;
}

.queue-title {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2a2a4a;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.queue-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-time {
  font-size: 12px;
  color: #888;
}

/* Mobile */
@media (max-width: 768px) {
  .type-selector {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 3: 验证类型检查**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 18: 弹窗集成到布局

**Files:**
- Modify: `src/components/Layout/GameLayout.tsx`

- [ ] **Step 1: 更新 GameLayout.tsx 集成弹窗**

在文件中添加弹窗组件的导入和渲染：

```tsx
import { useGameStore } from '@/api/store'
import { useResponsive } from '@/hooks/useResponsive'
import GameCanvas from '@/components/Map/GameCanvas'
import SidePanel from '@/components/Layout/SidePanel'
import BottomNav from '@/components/Layout/BottomNav'
import ArmyDialog from '@/components/dialogs/ArmyDialog'
import SoldierDialog from '@/components/dialogs/SoldierDialog'
import './GameLayout.css'

export default function GameLayout() {
  const { roleInfo, activeDialog, setActiveDialog } = useGameStore()
  const { isMobile } = useResponsive()

  const resources = roleInfo?.resources || { food: 0, wood: 0, stone: 0, gold: 0 }

  return (
    <div className="game-layout">
      <div className="game-header">
        <div className="header-resources">
          <span>🌾 {resources.food}</span>
          <span>🪵 {resources.wood}</span>
          <span>🪨 {resources.stone}</span>
          <span>🪙 {resources.gold}</span>
        </div>
        <div className="header-info">
          <span>Lv.{roleInfo?.level || 1}</span>
          <span>{roleInfo?.name || '玩家'}</span>
        </div>
      </div>

      <div className="game-main">
        <GameCanvas />
        {!isMobile && <SidePanel />}
      </div>

      {isMobile && <BottomNav />}

      {/* 弹窗 */}
      <ArmyDialog
        isOpen={activeDialog === 'army'}
        onClose={() => setActiveDialog(null)}
      />
      <SoldierDialog
        isOpen={activeDialog === 'soldier'}
        onClose={() => setActiveDialog(null)}
      />
    </div>
  )
}
```

- [ ] **Step 2: 更新 store.ts 添加 activeDialog 类型**

在 `src/api/store.ts` 中更新 `GameState` 接口：

```typescript
// 在 GameState 接口中找到 activeDialog 定义，更新为：
activeDialog: 'army' | 'soldier' | 'heal' | 'item' | null;

// 更新 setActiveDialog action：
setActiveDialog: (dialog: 'army' | 'soldier' | 'heal' | 'item' | null) => void;
```

- [ ] **Step 3: 验证编译**

Run: `npx tsc --noEmit`

Expected: 无类型错误

- [ ] **Step 4: 提交 Phase 4**

```bash
cd /root/ai_project/p1client
git add .
git commit -m "feat: Phase 4 - 交互完善完成

- 军队弹窗组件 (创建/解散军队)
- 士兵训练弹窗 (选择兵种/等级/数量)
- 弹窗集成到布局"
```

---

## Phase 5: 优化与完成

### Task 19: 错误处理和加载状态

**Files:**
- Create: `src/components/common/Loading.tsx`
- Create: `src/components/common/Toast.tsx`
- Modify: `src/api/store.ts`

- [ ] **Step 1: 创建 src/components/common/Loading.tsx**

```tsx
import './Loading.css'

interface LoadingProps {
  text?: string
  fullScreen?: boolean
}

export function Loading({ text = '加载中...', fullScreen = false }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-spinner" />
        <span className="loading-text">{text}</span>
      </div>
    )
  }

  return (
    <div className="loading-inline">
      <div className="loading-spinner" />
      <span className="loading-text">{text}</span>
    </div>
  )
}
```

- [ ] **Step 2: 创建 src/components/common/Loading.css**

```css
.loading-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 46, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 9999;
}

.loading-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #4a4a6a;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #888;
  font-size: 14px;
}
```

- [ ] **Step 3: 创建 src/components/common/Toast.tsx**

```tsx
import { useEffect, useState } from 'react'
import './Toast.css'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`toast toast-${type} ${visible ? 'visible' : 'hidden'}`}>
      <span className="toast-message">{message}</span>
    </div>
  )
}

// Toast 管理器
let toastContainer: HTMLDivElement | null = null
let toasts: HTMLDivElement[] = []

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = 'toast-container'
    document.body.appendChild(toastContainer)
  }
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  ensureContainer()

  const toast = document.createElement('div')
  toast.className = `toast toast-${type} visible`
  toast.innerHTML = `<span class="toast-message">${message}</span>`
  toastContainer!.appendChild(toast)

  setTimeout(() => {
    toast.classList.remove('visible')
    toast.classList.add('hidden')
    setTimeout(() => {
      toastContainer!.removeChild(toast)
    }, 300)
  }, 3000)
}
```

- [ ] **Step 4: 创建 src/components/common/Toast.css**

```css
.toast-container {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
  min-width: 200px;
  text-align: center;
}

.toast.visible {
  opacity: 1;
  transform: translateY(0);
}

.toast.hidden {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-success {
  background: rgba(76, 175, 80, 0.9);
  color: white;
}

.toast-error {
  background: rgba(244, 67, 54, 0.9);
  color: white;
}

.toast-info {
  background: rgba(33, 150, 243, 0.9);
  color: white;
}
```

- [ ] **Step 5: 验证编译**

Run: `npx tsc --noEmit`

Expected: 无类型错误

---

### Task 20: 最终集成和测试

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/common/index.ts`

- [ ] **Step 1: 创建组件导出索引 src/components/common/index.ts**

```typescript
export { Button } from './Button'
export { Modal } from './Modal'
export { Loading } from './Loading'
export { Toast, showToast } from './Toast'
```

- [ ] **Step 2: 更新 App.tsx 添加全局加载状态**

```tsx
import { useGameStore } from '@/api/store'
import { Loading } from '@/components/common'
import LoginPage from '@/components/Login/LoginPage'
import GameLayout from '@/components/Layout/GameLayout'
import './App.css'

function App() {
  const { isLoggedIn, isConnected } = useGameStore()

  // 未连接时显示加载
  if (!isConnected) {
    return <Loading fullScreen text="连接服务器中..." />
  }

  // 未登录时显示登录页
  if (!isLoggedIn) {
    return <LoginPage />
  }

  // 已登录显示游戏界面
  return <GameLayout />
}

export default App
```

- [ ] **Step 3: 运行完整测试**

Run: `npm run dev`

Expected: 开发服务器正常启动，无错误

- [ ] **Step 4: 构建生产版本**

Run: `npm run build`

Expected: 构建成功，生成 dist 目录

- [ ] **Step 5: 提交最终代码**

```bash
cd /root/ai_project/p1client
git add .
git commit -m "feat: Phase 5 - 优化与完成

- 加载状态组件
- Toast 提示组件
- 全局错误处理
- 最终集成

完成 SLG 网页游戏前端开发"
```

---

## 实施完成

所有任务已完成，项目结构如下：

```
p1client/
├── src/
│   ├── main.tsx              # 入口
│   ├── App.tsx               # 主应用
│   ├── sdk/                  # SDK集成
│   ├── api/                  # API层
│   ├── game/                 # Three.js游戏核心
│   ├── components/           # React组件
│   ├── hooks/                # 自定义Hooks
│   └── utils/                # 工具函数
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**启动命令：**
- 开发: `npm run dev`
- 构建: `npm run build`
- 预览: `npm run preview`

