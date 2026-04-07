import { GameAPI, WSClient } from '@/sdk'

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
    await this.ws.connect()
  }

  disconnect(): void {
    this.ws.disconnect()
  }
}

export const gameClient = new GameClient()
