import { GameAPI, WSClient } from '@/sdk'
import { useGameStore } from './store'

const WS_URL = 'ws://localhost:44446/ws'

class GameClient {
  public ws: WSClient
  public api: GameAPI

  constructor() {
    this.ws = new WSClient({
      url: WS_URL,
      reconnect: true,
      reconnectInterval: 2000, // 减少重连间隔
      maxReconnectAttempts: 10, // 增加重连尝试次数
      heartbeatInterval: 15000, // 减少心跳间隔
    })
    
    // 添加连接状态事件处理
    this.ws.onConnected = () => {
      console.log('WebSocket connected successfully');
      const store = useGameStore.getState()
      store.setConnected(true)
    }
    
    this.ws.onDisconnected = () => {
      console.log('WebSocket disconnected');
      const store = useGameStore.getState()
      store.setConnected(false)
    }
    
    this.ws.onError = (error) => {
      console.error('WebSocket error:', error);
      console.error('Error details:', {
        type: error.type,
        target: error.target,
        currentTarget: error.currentTarget,
        eventPhase: error.eventPhase,
        isTrusted: error.isTrusted
      });
    }
    
    this.api = new GameAPI(this.ws)
  }

  async connect(): Promise<void> {
    await this.ws.connect()
  }

  disconnect(): void {
    this.ws.disconnect()
  }
}

export const gameClient = new GameClient()
