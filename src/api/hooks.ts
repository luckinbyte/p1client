import { useCallback, useEffect } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { PushMsgID, type ArmyData, type CityData, type SceneObject } from '@/sdk'

export function usePushHandlers() {
  const addSceneObject = useGameStore((state) => state.addSceneObject)
  const removeSceneObject = useGameStore((state) => state.removeSceneObject)
  const updateSceneObjectPosition = useGameStore((state) => state.updateSceneObjectPosition)
  const setArmies = useGameStore((state) => state.setArmies)
  const setSoldiers = useGameStore((state) => state.setSoldiers)
  const setTrainQueue = useGameStore((state) => state.setTrainQueue)
  const setHealQueue = useGameStore((state) => state.setHealQueue)
  const setBattleStatus = useGameStore((state) => state.setBattleStatus)
  const setRoleInfo = useGameStore((state) => state.setRoleInfo)
  const addEventLog = useGameStore((state) => state.addEventLog)
  const updateResources = useGameStore((state) => state.updateResources)

  const refreshSoldierState = async () => {
    const [soldiersResponse, trainQueueResponse, healQueueResponse] = await Promise.all([
      gameClient.api.getSoldiers(),
      gameClient.api.getTrainQueue(),
      gameClient.api.getHealQueue(),
    ])

    if (soldiersResponse.data) {
      setSoldiers(soldiersResponse.data as never)
    }
    if (trainQueueResponse.data) {
      setTrainQueue(trainQueueResponse.data as never)
    }
    if (healQueueResponse.data) {
      setHealQueue(healQueueResponse.data as never)
    }
  }

  const refreshBattleState = async () => {
    const [roleInfoResponse, armiesResponse, soldiersResponse] = await Promise.all([
      gameClient.api.getRoleInfo(),
      gameClient.api.getArmies(),
      gameClient.api.getSoldiers(),
    ])

    if (roleInfoResponse.data) {
      setRoleInfo(roleInfoResponse.data as never)
    }
    if (armiesResponse.data) {
      setArmies(armiesResponse.data as never)
    }
    if (soldiersResponse.data) {
      setSoldiers(soldiersResponse.data as never)
    }
  }

  useEffect(() => {
    const unsubscribeSceneEnter = gameClient.ws.on(PushMsgID.SceneEnter, (data) => {
      const sceneObject = data as SceneObject
      addSceneObject(sceneObject)
      addEventLog(`场景进入：目标 #${sceneObject.id}`)
    })

    const unsubscribeSceneLeave = gameClient.ws.on(PushMsgID.SceneLeave, (data) => {
      const payload = data as { id?: number; objectId?: number }
      const objectId = payload.id ?? payload.objectId
      if (typeof objectId === 'number') {
        removeSceneObject(objectId)
        addEventLog(`场景离开：目标 #${objectId}`)
      }
    })

    const unsubscribeSceneUpdate = gameClient.ws.on(PushMsgID.SceneUpdate, (data) => {
      const sceneObject = data as SceneObject
      addSceneObject(sceneObject)
      addEventLog(`场景更新：目标 #${sceneObject.id}`)
    })

    const handleMarchPosition = (label: string) => (data: unknown) => {
      const payload = data as { id?: number; objectId?: number; position?: { x: number; y: number } }
      const objectId = payload.id ?? payload.objectId
      if (typeof objectId === 'number' && payload.position) {
        updateSceneObjectPosition(objectId, payload.position)
        addEventLog(`${label}：军队 #${objectId} -> (${payload.position.x}, ${payload.position.y})`)
      }
    }

    const handleMarchStart = handleMarchPosition('开始行军')
    const handleMarchArrive = handleMarchPosition('到达目标')
    const handleMarchReturn = handleMarchPosition('返回行军')

    const unsubscribeMarchStart = gameClient.ws.on(PushMsgID.MarchStart, handleMarchStart)
    const unsubscribeMarchArrive = gameClient.ws.on(PushMsgID.MarchArrive, handleMarchArrive)
    const unsubscribeMarchReturn = gameClient.ws.on(PushMsgID.MarchReturn, handleMarchReturn)

    const unsubscribeBattleStart = gameClient.ws.on(PushMsgID.BattleStart, (data) => {
      const payload = data as { attackerId?: number; defenderId?: number; battleId?: number }
      const battleLabel = payload.battleId ? `战斗 #${payload.battleId}` : '战斗'
      const attacker = payload.attackerId ? `进攻方 ${payload.attackerId}` : '进攻方'
      const defender = payload.defenderId ? `防守方 ${payload.defenderId}` : '防守方'
      const message = `${battleLabel} 开始：${attacker} vs ${defender}`
      setBattleStatus(message)
      addEventLog(message)
    })

    const unsubscribeBattleEnd = gameClient.ws.on(PushMsgID.BattleEnd, (data) => {
      const payload = data as { winnerId?: number; battleId?: number; result?: string }
      const battleLabel = payload.battleId ? `战斗 #${payload.battleId}` : '战斗'
      const resultLabel = payload.result || (payload.winnerId ? `胜利方 ${payload.winnerId}` : '战斗结束')
      const message = `${battleLabel} 结束：${resultLabel}`
      setBattleStatus(message)
      addEventLog(message)
      void refreshBattleState()
    })

    const unsubscribeTrainComplete = gameClient.ws.on(PushMsgID.TrainComplete, () => {
      addEventLog('训练完成，可领取训练结果')
      void refreshSoldierState()
    })

    const unsubscribeHealComplete = gameClient.ws.on(PushMsgID.HealComplete, () => {
      addEventLog('治疗完成，可领取治疗结果')
      void refreshSoldierState()
    })

    // 资源推送监听：服务端资源更新 push (msgId=1003) 无专用 handler，
    // 通过 onPush 全局回调接收并更新 resources store
    gameClient.ws.onPush = (raw) => {
      const payload = raw as { code?: number; data?: Record<string, unknown> }
      const data = payload?.data
      if (!data) return

      // 资源推送: { code, data: { rid, food, wood, stone, gold } }
      if (typeof data.food === 'number' || typeof data.gold === 'number') {
        updateResources({
          food: data.food as number,
          wood: data.wood as number,
          stone: data.stone as number,
          gold: data.gold as number,
        })
      }
    }

    return () => {
      gameClient.ws.onPush = undefined
      unsubscribeSceneEnter()
      unsubscribeSceneLeave()
      unsubscribeSceneUpdate()
      unsubscribeMarchStart()
      unsubscribeMarchArrive()
      unsubscribeMarchReturn()
      unsubscribeBattleStart()
      unsubscribeBattleEnd()
      unsubscribeTrainComplete()
      unsubscribeHealComplete()
    }
  }, [
    addSceneObject,
    removeSceneObject,
    setArmies,
    setBattleStatus,
    setHealQueue,
    setRoleInfo,
    setSoldiers,
    setTrainQueue,
    updateResources,
    updateSceneObjectPosition,
  ])
}

export function useGameApi() {
  const store = useGameStore()

  const connect = useCallback(async () => {
    await gameClient.connect()
  }, [])

  const disconnect = useCallback(() => {
    gameClient.disconnect()
    store.setConnected(false)
  }, [store])

  const login = useCallback(async () => {
    console.log('[API] starting login...');
    const response = await gameClient.api.login()
    console.log('[API] login response:', response);

    if (response.code !== 0) {
      console.error('[API] login failed:', response.message);
      throw new Error(response.message || 'Login failed')
    }

    console.log('[API] login successful');
    // 暂时不设置 isLoggedIn，等到 loadInitialData 完成后再设置
    // store.setLoggedIn(true)
    return response
  }, [])

  const loadInitialData = useCallback(async () => {
    // 串行加载数据，避免后端处理过多并行请求
    const roleInfo = await gameClient.api.getRoleInfo();
    const armies = await gameClient.api.getArmies();
    const soldiers = await gameClient.api.getSoldiers();
    const trainQueue = await gameClient.api.getTrainQueue();
    const healQueue = await gameClient.api.getHealQueue();
    const items = await gameClient.api.getItems();

    // 服务端 get_info 返回扁平字段 { rid, name, level, exp, gold, vip, food, wood, stone }
    // 前端 RoleInfo 期望嵌套 resources: { food, wood, stone, gold }
    if (roleInfo.data) {
      const d = roleInfo.data as Record<string, unknown>
      store.setRoleInfo({
        rid: d.rid as bigint,
        name: (d.name as string) ?? '',
        level: (d.level as number) ?? 1,
        exp: (d.exp as number) ?? 0,
        vip: (d.vip as number) ?? 0,
        resources: {
          food: (d.food as number) ?? 0,
          wood: (d.wood as number) ?? 0,
          stone: (d.stone as number) ?? 0,
          gold: (d.gold as number) ?? 0,
        },
        position: { x: 0, y: 0 },
      })
    }
    if (armies.data) {
      const d = armies.data as { armies?: unknown[] }
      store.setArmies((d.armies ?? []) as never)
    }
    if (soldiers.data) {
      const d = soldiers.data as { soldiers?: unknown[] }
      store.setSoldiers((d.soldiers ?? []) as never)
    }
    if (trainQueue.data) {
      const d = trainQueue.data as { queue?: unknown[] }
      store.setTrainQueue((d.queue ?? []) as never)
    }
    if (healQueue.data) {
      const d = healQueue.data as { queue?: unknown }
      store.setHealQueue(Array.isArray(d.queue) ? d.queue as never : d.queue ? [d.queue] as never : [] as never)
    }
    if (items.data) {
      const d = items.data as { items?: unknown[] }
      store.setItems((d.items ?? []) as never)
    }

    // 获取城池数据
    const cityResult = await gameClient.api.getCityInfo()
    if (cityResult.data) {
      const cityData = (cityResult.data as { city?: CityData }).city
      if (cityData) {
        store.setCityInfo(cityData)
      }
    }

    let sceneEnter = null
    let sceneInfo = null
    let nearby = null

    const initialSceneId = ((armies.data as ArmyData[] | undefined)?.[0]?.sceneId ?? 1)
    store.setSceneId(initialSceneId)

    // 使用城池坐标进入场景，没有城池则不传坐标
    const cityPosition = store.cityInfo?.position
    sceneEnter = await gameClient.api.enterScene(initialSceneId, cityPosition?.x, cityPosition?.y)

    if (sceneEnter.code === 0) {
      sceneInfo = await gameClient.api.getSceneInfo(initialSceneId)
      nearby = await gameClient.api.getNearby(initialSceneId)

      const sceneObjects = new Map<number, SceneObject>()

      // 服务端 get_nearby 返回 { nearby: [...], count: N }
      // 实体格式为 { id, type, x, y, scene_id, ... } 扁平结构
      const nearbyResult = nearby.data as { nearby?: Record<string, unknown>[] } | undefined
      const nearbyList = nearbyResult?.nearby

      if (Array.isArray(nearbyList)) {
        nearbyList.forEach((raw) => {
          const obj: SceneObject = {
            id: raw.id as number,
            type: raw.type as SceneObject['type'],
            position: { x: (raw.x as number) || 0, y: (raw.y as number) || 0 },
            ownerId: raw.owner_id as bigint | undefined,
            level: raw.level as number | undefined,
            resourceType: raw.resource_type as SceneObject['resourceType'],
            resourceAmount: raw.resource_amount as number | undefined,
          }
          sceneObjects.set(obj.id, obj)
        })
      }

      store.setSceneObjects(Array.from(sceneObjects.values()) as never)
    }

    // 所有数据加载完成后，设置 isLoggedIn 为 true，触发页面切换
    store.setLoggedIn(true)

    return { roleInfo, armies, soldiers, trainQueue, healQueue, items, sceneEnter, sceneInfo, nearby }
  }, [store])

  return {
    ...store,
    connect,
    disconnect,
    login,
    loadInitialData,
    client: gameClient,
  }
}
