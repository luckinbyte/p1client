# SLG网页游戏前端设计文档

## 概述

基于已实现的后端SDK，开发一个支持PC和移动端的SLG网页游戏前端。

**核心功能：**
- 2.5D俯视大地图，支持军队自由行军
- 多玩家城池展示
- 军队创建、行军、战斗
- 士兵训练与治疗系统
- 响应式设计，支持手机端

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | UI框架 |
| Vite | 构建工具 |
| Three.js | 3D地图渲染 |
| Zustand | 状态管理 |
| WebSocket | 服务器通信 |

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                      │
├─────────────────────────────────────────────────────────┤
│  TopBar      │  Three.js Game Canvas  │  SidePanel      │
│  (资源/信息)  │  (2.5D地图渲染)        │  (功能面板)     │
├─────────────────────────────────────────────────────────┤
│                    Game State Store                       │
│           (Zustand - 轻量状态管理)                        │
├─────────────────────────────────────────────────────────┤
│                    API Layer                              │
│              WSClient + GameAPI (SDK)                     │
├─────────────────────────────────────────────────────────┤
│                  WebSocket Connection                     │
│                  ws://localhost:8080/ws                   │
└─────────────────────────────────────────────────────────┘
```

## 项目结构

```
p1client/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── Login/
│   │   │   └── LoginPage.tsx
│   │   ├── Layout/
│   │   │   ├── TopBar.tsx
│   │   │   ├── SidePanel.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── Map/
│   │   │   └── GameCanvas.tsx
│   │   ├── dialogs/
│   │   │   ├── ArmyDialog.tsx
│   │   │   ├── SoldierDialog.tsx
│   │   │   ├── HealDialog.tsx
│   │   │   └── BattleReport.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   │
│   ├── game/
│   │   ├── GameScene.ts
│   │   ├── MapRenderer.ts
│   │   ├── EntityRenderer.ts
│   │   ├── CameraController.ts
│   │   ├── MarchAnimation.ts
│   │   └── SelectionManager.ts
│   │
│   ├── api/
│   │   ├── client.ts
│   │   ├── store.ts
│   │   └── hooks.ts
│   │
│   ├── hooks/
│   │   ├── useGame.ts
│   │   ├── useResponsive.ts
│   │   └── useWebSocket.ts
│   │
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
│
└── sdk/
    └── frontend/
```

## 模块详细设计

### 1. 登录模块

**功能：** 完整账户系统（登录/注册）

**界面元素：**
- 登录表单（用户名/密码）
- 注册表单（用户名/密码/确认密码）
- 切换按钮

**SDK协议：** `MsgID.Role.Login (1001)`

### 2. 大地图模块

**地图配置：**
- 尺寸：500x500格子
- 视角：2.5D正交相机
- 支持：鼠标拖拽、滚轮缩放、触控手势

**场景实体渲染：**

| 实体类型 | 渲染方式 | 交互 |
|---------|---------|------|
| 资源点 | 颜色方块（绿=粮、棕=木、灰=石、黄=金） | 点击派兵采集 |
| 玩家城池 | 城墙模型+玩家名 | 点击查看信息 |
| 己方军队 | 蓝色旗帜+士兵数 | 点击查看/操作 |
| 敌方军队 | 红色旗帜 | 点击查看信息 |
| 行军路线 | 虚线箭头 | 动画显示进度 |

**相机控制：**
- 桌面：鼠标拖拽平移，滚轮缩放
- 移动端：单指拖动平移，双指缩放

### 3. 军队模块

**功能：**
- 创建军队（选择英雄、配置士兵）
- 行军操作（选择目标、选择类型）
- 取消行军
- 查看军队详情

**SDK协议：**
- `MsgID.March.CreateArmy (4001)`
- `MsgID.March.DeleteArmy (4002)`
- `MsgID.March.GetArmies (4003)`
- `MsgID.March.StartMarch (4004)`
- `MsgID.March.CancelMarch (4005)`

### 4. 士兵模块

**功能：**
- 训练士兵（选择兵种、等级、数量）
- 训练队列管理
- 治疗伤兵
- 治疗队列管理
- 解散士兵

**SDK协议：**
- `MsgID.Soldier.List (5001)`
- `MsgID.Soldier.Train (5003)`
- `MsgID.Soldier.TrainQueue (5005)`
- `MsgID.Soldier.Heal (5007)`
- `MsgID.Soldier.HealQueue (5009)`
- `MsgID.Soldier.Configs (5012)`

**士兵类型：**
- 步兵：高防御，近战主力
- 骑兵：高机动，快速突击
- 弓兵：高攻击，远程输出
- 攻城：攻城利器，高负重

### 5. 信息面板

**顶部状态栏：**
- 资源显示（粮、木、石、金）
- 战力、等级
- 设置、退出按钮

**功能面板：**
- 我的军队
- 士兵训练
- 伤兵营
- 物品背包

## 响应式设计

**布局断点：**
```typescript
const BREAKPOINTS = {
  mobile: 768,   // 手机端
  tablet: 1024,  // 平板
  desktop: 1280  // 桌面
};
```

**布局切换：**
- `width < 768`: 手机端布局（底部Tab导航）
- `width >= 768`: 桌面端布局（右侧面板）

**手机端布局：**
```
┌─────────────────────┐
│ 🌾12.5K 🪵8.3K ... │
├─────────────────────┤
│                     │
│    Three.js 地图    │
│               [+]   │
├─────────────────────┤
│ [地图][军队][士兵]  │
└─────────────────────┘
```

## 状态管理

**GameState接口：**
```typescript
interface GameState {
  // 玩家信息
  roleInfo: RoleInfo | null;
  isLoggedIn: boolean;

  // 场景数据
  sceneId: number;
  sceneObjects: SceneObject[];

  // 军队数据
  armies: ArmyData[];

  // 士兵数据
  soldiers: SoldierData[];
  trainQueue: TrainQueueItem[];
  healQueue: HealQueueItem[];

  // UI状态
  selectedEntity: SceneObject | null;
  activeDialog: string | null;
}
```

## 推送消息处理

| 推送ID | 事件 | 处理 |
|--------|------|------|
| 6001 | SceneEnter | 添加实体到地图 |
| 6002 | SceneLeave | 移除实体 |
| 6101 | MarchStart | 开始行军动画 |
| 6102 | MarchArrive | 到达处理 |
| 6202 | BattleEnd | 显示战斗报告 |
| 6301 | TrainComplete | 更新士兵数量 |

## 战斗表现

**简单动画方案：**
- 军队到达目标后，在地图上显示战斗图标
- 显示战斗进度条
- 战斗结束后弹出战报

## 采集机制

**自动采集返回：**
- 军队到达资源点后自动开始采集
- 采集完成后自动返回城池
- 返回时携带资源

## 依赖清单

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/three": "^0.160.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

## 后端SDK集成

SDK文件位置：`/root/ai_project/wg_ai/sdk/frontend/`

需要复制的文件：
- `src/types.ts` - 类型定义
- `src/api.ts` - WebSocket客户端
- `src/protocol.ts` - 消息ID常量
- `config/soldier.json` - 士兵配置

## 实施优先级

1. **Phase 1: 基础框架**
   - 项目初始化
   - SDK集成
   - 登录界面

2. **Phase 2: 地图系统**
   - Three.js场景搭建
   - 地图渲染
   - 相机控制

3. **Phase 3: 核心功能**
   - 场景实体显示
   - 军队系统
   - 士兵系统

4. **Phase 4: 交互完善**
   - 行军动画
   - 战斗表现
   - 推送处理

5. **Phase 5: 优化**
   - 移动端适配
   - 性能优化
   - 错误处理
