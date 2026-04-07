import { create } from 'zustand'
import type {
  ArmyData,
  HealQueueItem,
  ItemData,
  Position,
  Resources,
  RoleInfo,
  SceneObject,
  SoldierData,
  TrainQueueItem,
} from '@/sdk'

type ActiveTab = 'map' | 'army' | 'soldier' | 'item' | 'city'

type EventLogItem = {
  id: number
  message: string
}

interface GameState {
  isConnected: boolean
  isLoggedIn: boolean
  roleInfo: RoleInfo | null
  sceneId: number
  sceneObjects: SceneObject[]
  armies: ArmyData[]
  selectedArmyId: number | null
  soldiers: SoldierData[]
  trainQueue: TrainQueueItem[]
  healQueue: HealQueueItem[]
  items: ItemData[]
  selectedEntity: SceneObject | null
  selectedPosition: Position | null
  activeDialog: string | null
  battleStatus: string
  eventLogs: EventLogItem[]
  activeTab: ActiveTab
  setConnected: (connected: boolean) => void
  setLoggedIn: (loggedIn: boolean) => void
  setRoleInfo: (info: RoleInfo | null) => void
  setSceneId: (id: number) => void
  setSceneObjects: (objects: SceneObject[]) => void
  addSceneObject: (object: SceneObject) => void
  removeSceneObject: (id: number) => void
  updateSceneObjectPosition: (id: number, position: Position) => void
  setArmies: (armies: ArmyData[]) => void
  setSelectedArmyId: (armyId: number | null) => void
  setSoldiers: (soldiers: SoldierData[]) => void
  setTrainQueue: (queue: TrainQueueItem[]) => void
  setHealQueue: (queue: HealQueueItem[]) => void
  setItems: (items: ItemData[]) => void
  setSelectedEntity: (entity: SceneObject | null) => void
  setSelectedPosition: (position: Position | null) => void
  setActiveDialog: (dialog: string | null) => void
  setBattleStatus: (status: string) => void
  addEventLog: (message: string) => void
  clearEventLogs: () => void
  setActiveTab: (tab: ActiveTab) => void
  updateResources: (resources: Partial<Resources>) => void
  logout: () => void
}

const initialState = {
  isConnected: false,
  isLoggedIn: false,
  roleInfo: null,
  sceneId: 0,
  sceneObjects: [] as SceneObject[],
  armies: [] as ArmyData[],
  selectedArmyId: null as number | null,
  soldiers: [] as SoldierData[],
  trainQueue: [] as TrainQueueItem[],
  healQueue: [] as HealQueueItem[],
  items: [] as ItemData[],
  selectedEntity: null,
  selectedPosition: null,
  activeDialog: null,
  battleStatus: '',
  eventLogs: [] as EventLogItem[],
  activeTab: 'map' as ActiveTab,
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  setConnected: (connected) => set({ isConnected: connected }),
  setLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
  setRoleInfo: (roleInfo) => set({ roleInfo }),
  setSceneId: (sceneId) => set({ sceneId }),
  setSceneObjects: (sceneObjects) => set({ sceneObjects }),
  addSceneObject: (object) =>
    set((state) => ({
      sceneObjects: [...state.sceneObjects.filter((item) => item.id !== object.id), object],
    })),
  removeSceneObject: (id) =>
    set((state) => ({
      sceneObjects: state.sceneObjects.filter((object) => object.id !== id),
    })),
  updateSceneObjectPosition: (id, position) =>
    set((state) => ({
      sceneObjects: state.sceneObjects.map((object) =>
        object.id === id ? { ...object, position } : object,
      ),
    })),
  setArmies: (armies) =>
    set((state) => ({
      armies,
      selectedArmyId:
        armies.length === 0
          ? null
          : armies.some((army) => army.id === state.selectedArmyId)
            ? state.selectedArmyId
            : armies[0].id,
    })),
  setSelectedArmyId: (selectedArmyId) => set({ selectedArmyId }),
  setSoldiers: (soldiers) => set({ soldiers }),
  setTrainQueue: (trainQueue) => set({ trainQueue }),
  setHealQueue: (healQueue) => set({ healQueue }),
  setItems: (items) => set({ items }),
  setSelectedEntity: (selectedEntity) => set({ selectedEntity }),
  setSelectedPosition: (selectedPosition) => set({ selectedPosition }),
  setActiveDialog: (activeDialog) => set({ activeDialog }),
  setBattleStatus: (battleStatus) => set({ battleStatus }),
  addEventLog: (message) =>
    set((state) => ({
      eventLogs: [{ id: Date.now(), message }, ...state.eventLogs].slice(0, 12),
    })),
  clearEventLogs: () => set({ eventLogs: [] }),
  setActiveTab: (activeTab) => set({ activeTab }),
  updateResources: (resources) =>
    set((state) => ({
      roleInfo: state.roleInfo
        ? {
            ...state.roleInfo,
            resources: {
              ...state.roleInfo.resources,
              ...resources,
            },
          }
        : null,
    })),
  logout: () => set({ ...initialState }),
}))
