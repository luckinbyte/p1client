import { useCallback, useEffect } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { PushMsgID, type ArmyData, type SceneInfo, type SceneObject } from '@/sdk'

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

    return () => {
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
    updateSceneObjectPosition,
  ])
}

export function useGameApi() {
  const store = useGameStore()

  const connect = useCallback(async () => {
    await gameClient.connect()
    store.setConnected(true)
  }, [store])

  const disconnect = useCallback(() => {
    gameClient.disconnect()
    store.setConnected(false)
  }, [store])

  const login = useCallback(
    async (token: string) => {
      const response = await gameClient.api.login(token)

      if (response.code !== 0) {
        throw new Error(response.message || 'Login failed')
      }

      store.setLoggedIn(true)
      return response
    },
    [store],
  )

  const loadInitialData = useCallback(async () => {
    const [roleInfo, armies, soldiers, trainQueue, healQueue, items] = await Promise.all([
      gameClient.api.getRoleInfo(),
      gameClient.api.getArmies(),
      gameClient.api.getSoldiers(),
      gameClient.api.getTrainQueue(),
      gameClient.api.getHealQueue(),
      gameClient.api.getItems(),
    ])

    if (roleInfo.data) {
      store.setRoleInfo(roleInfo.data as never)
    }
    if (armies.data) {
      store.setArmies(armies.data as never)
    }
    if (soldiers.data) {
      store.setSoldiers(soldiers.data as never)
    }
    if (trainQueue.data) {
      store.setTrainQueue(trainQueue.data as never)
    }
    if (healQueue.data) {
      store.setHealQueue(healQueue.data as never)
    }
    if (items.data) {
      store.setItems(items.data as never)
    }

    let sceneEnter = null
    let sceneInfo = null
    let nearby = null

    const initialSceneId = ((armies.data as ArmyData[] | undefined)?.[0]?.sceneId ?? 1)
    store.setSceneId(initialSceneId)

    sceneEnter = await gameClient.api.enterScene(initialSceneId)

    if (sceneEnter.code === 0) {
      sceneInfo = await gameClient.api.getSceneInfo(initialSceneId)
      nearby = await gameClient.api.getNearby()

      const sceneObjects = new Map<number, SceneObject>()

      const sceneInfoData = sceneInfo.data as SceneInfo | undefined
      const nearbyData = nearby.data as SceneObject[] | undefined

      if (Array.isArray(sceneInfoData?.objects)) {
        store.setSceneId(sceneInfoData.id)
        sceneInfoData.objects.forEach((object) => {
          sceneObjects.set(object.id, object)
        })
      }

      if (Array.isArray(nearbyData)) {
        nearbyData.forEach((object) => {
          sceneObjects.set(object.id, object)
        })
      }

      store.setSceneObjects(Array.from(sceneObjects.values()) as never)
    }

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
