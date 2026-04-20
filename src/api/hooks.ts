import { useCallback, useEffect } from 'react'
import { gameClient } from '@/api/client'
import { useGameStore } from '@/api/store'
import { EntityType, PushMsgID, type ArmyData, type CityData, type MarchData, type RoleInfo, type SceneObject, type SoldierData, type TrainQueueItem } from '@/sdk'
import { RESOURCE_TYPE_MAP } from '@/utils/constants'

type RawTrainQueueItem = {
  id?: number
  soldierId?: number
  soldier_id?: number
  soldierType?: number
  soldier_type?: number
  level?: number
  count?: number
  startTime?: number
  start_time?: number
  finishTime?: number
  finish_time?: number
  isUpgrade?: boolean
  is_upgrade?: boolean
}

type RawMarchData = {
  type?: string
  targetId?: number
  target_id?: number
  targetPos?: { x?: number; y?: number }
  target_pos?: { x?: number; y?: number }
  path?: Array<{ x?: number; y?: number }>
  startTime?: number
  start_time?: number
  arrivalTime?: number
  arrival_time?: number
  speed?: number
  progress?: number
  collectEndTime?: number
  collect_end_time?: number
}

type RawArmyData = {
  id?: number
  ownerId?: bigint | number | string
  owner_id?: bigint | number | string
  heroId?: number
  hero_id?: number
  soldiers?: Record<string, number> | Record<number, number>
  status?: string
  position?: { x?: number; y?: number }
  sceneId?: number
  scene_id?: number
  march?: RawMarchData
  load?: {
    food?: number
    wood?: number
    stone?: number
    gold?: number
  }
}

function normalizeSoldiers(data: unknown): SoldierData[] {
  if (Array.isArray(data)) {
    return data as SoldierData[]
  }

  if (data && typeof data === 'object') {
    const soldiers = (data as { soldiers?: unknown }).soldiers
    if (Array.isArray(soldiers)) {
      return soldiers as SoldierData[]
    }
  }

  return []
}

function normalizeTrainQueueItem(item: unknown): TrainQueueItem | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const raw = item as RawTrainQueueItem
  const id = raw.id
  const soldierId = raw.soldierId ?? raw.soldier_id
  const soldierType = raw.soldierType ?? raw.soldier_type
  const level = raw.level
  const count = raw.count
  const startTime = raw.startTime ?? raw.start_time
  const finishTime = raw.finishTime ?? raw.finish_time
  const isUpgrade = raw.isUpgrade ?? raw.is_upgrade ?? false

  if (
    typeof id !== 'number' ||
    typeof soldierId !== 'number' ||
    typeof soldierType !== 'number' ||
    typeof level !== 'number' ||
    typeof count !== 'number' ||
    typeof startTime !== 'number' ||
    typeof finishTime !== 'number'
  ) {
    return null
  }

  return {
    id,
    soldierId,
    soldierType,
    level,
    count,
    startTime,
    finishTime,
    isUpgrade,
  }
}

function normalizeTrainQueue(data: unknown): TrainQueueItem[] {
  const queue = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { queue?: unknown }).queue)
      ? (data as { queue: unknown[] }).queue
      : []

  return queue
    .map((item) => normalizeTrainQueueItem(item))
    .filter((item): item is TrainQueueItem => item !== null)
}

function normalizeRoleInfo(data: unknown): RoleInfo | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const raw = data as Record<string, unknown>
  const rid = raw.rid
  const name = raw.name
  const level = raw.level
  const exp = raw.exp
  const vip = raw.vip

  if (typeof rid !== 'number') {
    return null
  }

  return {
    rid: BigInt(rid),
    name: typeof name === 'string' && name.trim().length > 0 ? name : `玩家${rid}`,
    level: typeof level === 'number' ? level : 1,
    exp: typeof exp === 'number' ? exp : 0,
    vip: typeof vip === 'number' ? vip : 0,
    resources: {
      food: typeof raw.food === 'number' ? raw.food : 0,
      wood: typeof raw.wood === 'number' ? raw.wood : 0,
      stone: typeof raw.stone === 'number' ? raw.stone : 0,
      gold: typeof raw.gold === 'number' ? raw.gold : 0,
    },
    position: { x: 0, y: 0 },
  }
}

function normalizeMarchData(data: unknown): MarchData | undefined {
  if (!data || typeof data !== 'object') {
    return undefined
  }

  const raw = data as RawMarchData
  const type = raw.type
  const targetId = raw.targetId ?? raw.target_id
  const targetPos = raw.targetPos ?? raw.target_pos
  const path = raw.path
  const startTime = raw.startTime ?? raw.start_time
  const arrivalTime = raw.arrivalTime ?? raw.arrival_time
  const speed = raw.speed
  const progress = raw.progress
  const collectEndTime = raw.collectEndTime ?? raw.collect_end_time

  if (
    typeof type !== 'string' ||
    typeof targetId !== 'number' ||
    !targetPos ||
    typeof targetPos.x !== 'number' ||
    typeof targetPos.y !== 'number' ||
    !Array.isArray(path) ||
    typeof startTime !== 'number' ||
    typeof arrivalTime !== 'number' ||
    typeof speed !== 'number' ||
    typeof progress !== 'number'
  ) {
    return undefined
  }

  return {
    type: type as MarchData['type'],
    targetId,
    targetPos: { x: targetPos.x, y: targetPos.y },
    path: path.map((point) => ({
      x: typeof point.x === 'number' ? point.x : 0,
      y: typeof point.y === 'number' ? point.y : 0,
    })),
    startTime,
    arrivalTime,
    speed,
    progress,
    ...(typeof collectEndTime === 'number' ? { collectEndTime } : {}),
  }
}

export function normalizeArmyItem(item: unknown): ArmyData | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const raw = item as RawArmyData
  const id = raw.id
  const ownerId = raw.ownerId ?? raw.owner_id
  const heroId = raw.heroId ?? raw.hero_id ?? 0
  const soldiers = raw.soldiers
  const status = raw.status
  const position = raw.position
  const sceneId = raw.sceneId ?? raw.scene_id
  const march = normalizeMarchData(raw.march)

  if (
    typeof id !== 'number' ||
    (typeof ownerId !== 'number' && typeof ownerId !== 'string' && typeof ownerId !== 'bigint') ||
    typeof heroId !== 'number' ||
    !soldiers ||
    typeof soldiers !== 'object' ||
    typeof status !== 'string' ||
    !position ||
    typeof position.x !== 'number' ||
    typeof position.y !== 'number' ||
    typeof sceneId !== 'number'
  ) {
    return null
  }

  return {
    id,
    ownerId: typeof ownerId === 'bigint' ? ownerId : BigInt(ownerId),
    heroId,
    soldiers: Object.fromEntries(
      Object.entries(soldiers).map(([soldierId, count]) => [Number(soldierId), typeof count === 'number' ? count : 0]),
    ),
    status: status as ArmyData['status'],
    position: { x: position.x, y: position.y },
    sceneId,
    ...(march ? { march } : {}),
    ...(raw.load
      ? {
          load: {
            food: typeof raw.load.food === 'number' ? raw.load.food : 0,
            wood: typeof raw.load.wood === 'number' ? raw.load.wood : 0,
            stone: typeof raw.load.stone === 'number' ? raw.load.stone : 0,
            gold: typeof raw.load.gold === 'number' ? raw.load.gold : 0,
          },
        }
      : {}),
  }
}

export function normalizeArmies(data: unknown): ArmyData[] {
  const armies = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { armies?: unknown }).armies)
      ? (data as { armies: unknown[] }).armies
      : []

  return armies
    .map((item) => normalizeArmyItem(item))
    .filter((item): item is ArmyData => item !== null)
}

let fetchArmyStatePromise: Promise<{ armies: ArmyData[]; soldiers: SoldierData[] }> | null = null

export async function fetchArmyState() {
  if (fetchArmyStatePromise) {
    return fetchArmyStatePromise
  }

  fetchArmyStatePromise = (async () => {
    try {
      const [armiesResponse, soldiersResponse] = await Promise.all([gameClient.api.getArmies(), gameClient.api.getSoldiers()])

      return {
        armies: normalizeArmies(armiesResponse.data),
        soldiers: normalizeSoldiers(soldiersResponse.data),
      }
    } finally {
      fetchArmyStatePromise = null
    }
  })()

  return fetchArmyStatePromise
}

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
  const setCityInfo = useGameStore((state) => state.setCityInfo)

  const refreshSoldierState = async () => {
    const [soldiersResponse, trainQueueResponse, healQueueResponse] = await Promise.all([
      gameClient.api.getSoldiers(),
      gameClient.api.getTrainQueue(),
      gameClient.api.getHealQueue(),
    ])

    if (soldiersResponse.data) {
      setSoldiers(normalizeSoldiers(soldiersResponse.data))
    }
    if (trainQueueResponse.data) {
      setTrainQueue(normalizeTrainQueue(trainQueueResponse.data) as never)
    }
    if (healQueueResponse.data) {
      const data = healQueueResponse.data as { queue?: unknown } | unknown[]
      const queue = Array.isArray(data) ? data : data.queue
      setHealQueue((Array.isArray(queue) ? queue : queue ? [queue] : []) as never)
    }
  }

  const refreshBattleState = async () => {
    const [roleInfoResponse, battleState] = await Promise.all([gameClient.api.getRoleInfo(), fetchArmyState()])

    if (roleInfoResponse.data) {
      const roleInfo = normalizeRoleInfo(roleInfoResponse.data)
      if (roleInfo) {
        setRoleInfo(roleInfo)
      }
    }

    setArmies(battleState.armies)
    setSoldiers(battleState.soldiers)
  }

  useEffect(() => {
    const unsubscribeSceneEnter = gameClient.ws.on(PushMsgID.SceneEnter, (data) => {
      const sceneObject = data as SceneObject
      addSceneObject(sceneObject)
      const typeLabel = sceneObject.type === EntityType.Resource
        ? `${RESOURCE_TYPE_MAP[sceneObject.resourceType ?? 1]?.name ?? '资源'}点`
        : sceneObject.type === EntityType.City ? '城池'
        : sceneObject.type === EntityType.Player ? '玩家部队'
        : '目标'
      addEventLog(`场景进入：${typeLabel} #${sceneObject.id}`)
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
      // No event log -- SceneUpdate fires frequently for position ticks
    })

    const handleMarchStart = (data: unknown) => {
      const payload = data as { id?: number; objectId?: number; position?: { x: number; y: number }; target_id?: number; targetId?: number }
      const objectId = payload.id ?? payload.objectId
      if (typeof objectId === 'number' && payload.position) {
        updateSceneObjectPosition(objectId, payload.position)
        const targetId = payload.target_id ?? payload.targetId ?? 0
        addEventLog(`行军开始：军队 #${objectId} -> 目标 #${targetId}`)
        void refreshBattleState()
      }
    }

    const handleMarchArrive = (data: unknown) => {
      const payload = data as { id?: number; objectId?: number; position?: { x: number; y: number } }
      const objectId = payload.id ?? payload.objectId
      if (typeof objectId === 'number' && payload.position) {
        updateSceneObjectPosition(objectId, payload.position)
        addEventLog(`到达目标：军队 #${objectId}`)
        void refreshBattleState()
      }
    }

    const handleMarchReturn = (data: unknown) => {
      const payload = data as { id?: number; objectId?: number; position?: { x: number; y: number } }
      const objectId = payload.id ?? payload.objectId
      if (typeof objectId === 'number') {
        if (payload.position) {
          updateSceneObjectPosition(objectId, payload.position)
        }
        addEventLog(`返回完成：军队 #${objectId}`)
        void refreshBattleState()

        // After army state refreshes, check for collected resources (D-05)
        void (async () => {
          const state = await fetchArmyState()
          const army = state.armies.find((a) => a.id === objectId)
          if (army?.load) {
            const parts: string[] = []
            if (army.load.food > 0) parts.push(`粮食 +${army.load.food}`)
            if (army.load.wood > 0) parts.push(`木材 +${army.load.wood}`)
            if (army.load.stone > 0) parts.push(`石材 +${army.load.stone}`)
            if (army.load.gold > 0) parts.push(`金币 +${army.load.gold}`)
            if (parts.length > 0) {
              addEventLog(`军队 #${objectId} 采集完毕：${parts.join('、')}`)
            }
          }
        })()
      }
    }

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

    const unsubscribeTrainComplete = gameClient.ws.on(PushMsgID.TrainComplete, (data) => {
      const payload = data as { soldier_type?: number; level?: number; count?: number; queue_id?: number }
      const soldierType = payload.soldier_type ?? 0
      const level = payload.level ?? 0
      const count = payload.count ?? 0
      addEventLog(`训练完成：兵种 ${soldierType} 等级 ${level} x${count}`)
      void refreshSoldierState()
    })

    const unsubscribeHealComplete = gameClient.ws.on(PushMsgID.HealComplete, () => {
      addEventLog('治疗完成，可领取治疗结果')
      void refreshSoldierState()
    })

    const unsubscribeBuildComplete = gameClient.ws.on(PushMsgID.BuildComplete, (data) => {
      const payload = data as { building_type?: number; target_level?: number; queue_id?: number }
      const buildingType = payload.building_type ?? 0
      const targetLevel = payload.target_level ?? 0
      addEventLog(`建造完成：建筑类型 ${buildingType} 升至等级 ${targetLevel}`)
      void (async () => {
        const cityResponse = await gameClient.api.getCityInfo()
        if (cityResponse.code === 0 && cityResponse.data) {
          const cityData = (cityResponse.data as { city?: CityData }).city
          if (cityData) {
            setCityInfo(cityData)
          }
        }
      })()
    })

    gameClient.ws.onPush = (raw) => {
      const payload = raw as { code?: number; data?: Record<string, unknown> }
      const data = payload?.data
      if (!data) return

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
      unsubscribeBuildComplete()
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
    setCityInfo,
    addEventLog,
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
    return response
  }, [])

  const loadInitialData = useCallback(async () => {
    const roleInfo = await gameClient.api.getRoleInfo()
    const armies = await gameClient.api.getArmies()
    const soldiers = await gameClient.api.getSoldiers()
    const trainQueue = await gameClient.api.getTrainQueue()
    const healQueue = await gameClient.api.getHealQueue()
    const items = await gameClient.api.getItems()

    if (roleInfo.data) {
      const normalizedRoleInfo = normalizeRoleInfo(roleInfo.data)
      if (normalizedRoleInfo) {
        store.setRoleInfo(normalizedRoleInfo)
      }
    }
    if (armies.data) {
      store.setArmies(normalizeArmies(armies.data))
    }
    if (soldiers.data) {
      store.setSoldiers(normalizeSoldiers(soldiers.data))
    }
    if (trainQueue.data) {
      store.setTrainQueue(normalizeTrainQueue(trainQueue.data) as never)
    }
    if (healQueue.data) {
      const d = healQueue.data as { queue?: unknown }
      store.setHealQueue(Array.isArray(d.queue) ? (d.queue as never) : d.queue ? ([d.queue] as never) : ([] as never))
    }
    if (items.data) {
      const d = items.data as { items?: unknown[] }
      store.setItems((d.items ?? []) as never)
    }

    const cityResult = await gameClient.api.getCityInfo()
    let cityInfo: CityData | null = null
    if (cityResult.data) {
      const cityData = (cityResult.data as { city?: CityData }).city
      if (cityData) {
        store.setCityInfo(cityData)
        cityInfo = cityData
      }
    }

    let sceneEnter = null
    let sceneInfo = null
    let nearby = null

    const normalizedArmies = normalizeArmies(armies.data)
    const initialSceneId = normalizedArmies[0]?.sceneId ?? 1
    store.setSceneId(initialSceneId)

    const cityPosition = cityInfo?.position
    sceneEnter = await gameClient.api.enterScene(initialSceneId, cityPosition?.x, cityPosition?.y)

    if (sceneEnter.code === 0) {
      sceneInfo = await gameClient.api.getSceneInfo(initialSceneId)
      nearby = await gameClient.api.getNearby(initialSceneId)

      const sceneObjects = new Map<number, SceneObject>()
      const nearbyResult = nearby.data as { nearby?: Record<string, unknown>[] } | undefined
      const nearbyList = nearbyResult?.nearby

      if (Array.isArray(nearbyList)) {
        nearbyList.forEach((raw) => {
          const obj: SceneObject = {
            id: raw.id as number,
            type: raw.type as SceneObject['type'],
            position: { x: (raw.x as number) || 0, y: (raw.y as number) || 0 },
            ownerId: raw.owner_id != null ? BigInt(raw.owner_id as number | string) : undefined,
            level: raw.level as number | undefined,
            resourceType: raw.resource_type as SceneObject['resourceType'],
            resourceAmount: raw.resource_amount as number | undefined,
          }
          sceneObjects.set(obj.id, obj)
        })
      }

      store.setSceneObjects(Array.from(sceneObjects.values()) as never)
    }

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
