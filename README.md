# p1client

SLG 网页游戏前端客户端，基于 TypeScript、React、Vite、Three.js 与 WebSocket 实现。

## 技术栈

- TypeScript
- React 18
- Vite
- Three.js
- Zustand
- WebSocket

## 当前已实现

当前前端基于已接入 SDK 的协议，实现了这些界面与交互：

- 登录页与基础连接流程
- 2.5D 大地图场景渲染
- 地图对象选中与信息展示
- 军队列表与选中
- 行军发起与取消行军
- 士兵训练、训练队列查看、取消训练
- 伤兵治疗与治疗队列领取
- 士兵解散与士兵统计
- 物品列表展示与使用
- 城池 / 建筑信息查看
- 事件日志与部分推送事件同步
- 移动端响应式布局与底部导航

## 目录结构

```text
src/
  api/            # WebSocket 客户端、接口封装、状态同步
  components/     # 登录页、布局、弹窗、地图组件
  game/           # Three.js 场景、相机、地图与对象渲染
  hooks/          # 响应式等自定义 hooks
  sdk/            # 前端 SDK 与协议定义
  utils/          # 常量与工具函数
```

## 运行要求

- Node.js 18+
- 可用的后端 WebSocket 服务

当前 WebSocket 地址配置在 `src/api/client.ts:2`：

```ts
const WS_URL = 'ws://localhost:8080/ws'
```

如果后端地址不同，请先修改这里。

## 本地启动

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

默认启动后可通过 Vite 本地地址访问页面。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 体验建议

推荐按下面顺序体验：

1. 启动后端服务与 WebSocket
2. 启动前端开发环境
3. 登录账号进入主场景
4. 在地图上查看城池、建筑、资源点、怪物等对象
5. 打开军队面板，查看军队状态并测试取消行军
6. 打开士兵面板，测试训练、取消训练、解散士兵、读取统计
7. 打开治疗面板，测试治疗与领取恢复结果
8. 打开物品面板，测试物品使用
9. 在手机尺寸下检查底部导航与弹窗显示

## 当前范围说明

本项目前端只实现 SDK 当前已支持协议对应的界面与交互，不额外假设后端未提供的能力。

例如：

- 已支持：场景进入、附近对象获取、军队查询、训练、治疗、物品使用等
- 暂未实现独立建造/升级操作：因为当前 SDK 未提供完整城建建造协议封装

## 仓库脚本

```bash
npm run dev      # 启动开发环境
npm run build    # TypeScript 检查并构建
npm run preview  # 预览生产构建
```
