import { MsgID } from './protocol';
import type {
  ApiResponse,
  BuildQueueResponse,
  CancelBuildResponse,
  CityInfoResponse,
  CityProductionResponse,
  UpgradeBuildingResponse,
} from './types';

const enum MsgType {
  Request = 0x01,
  Response = 0x02,
  Push = 0x03,
  Handshake = 0x04,
}

type RequestParams = Record<string, unknown>;

export interface WSConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export type EventCallback<T = unknown> = (data: T) => void;

interface RequestCallback {
  resolve: (response: ApiResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function decodeUtf8(buf: ArrayBuffer | Uint8Array): string {
  return new TextDecoder().decode(buf);
}

export class WSClient {
  private ws: WebSocket | null = null;
  private config: Required<WSConfig>;
  private requestId = 0;
  private pendingRequests = new Map<number, RequestCallback>();
  private eventHandlers = new Map<number, Set<EventCallback>>();
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;
  private shouldReconnect = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectResolve: ((value: void) => void) | null = null;
  private connectReject: ((reason: Error) => void) | null = null;

  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onError?: (error: Event) => void;

  constructor(config: WSConfig) {
    this.config = {
      url: config.url,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
    };
  }

  connect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }

    if (this.ws) {
      this.stopHeartbeat();
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.isConnected = false;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(this.config.url);
        ws.binaryType = 'arraybuffer';
        this.ws = ws;

        this.connectResolve = resolve;
        this.connectReject = reject;

        this.connectTimeout = setTimeout(() => {
          this.connectTimeout = null;
          this.connectResolve = null;
          this.connectReject = null;
          reject(new Error('Connection timeout'));
          ws.onclose = null;
          ws.close();
        }, 10000);

        ws.onopen = () => {
          const handshake = new Uint8Array([MsgType.Handshake]);
          ws.send(handshake);
        };

        ws.onclose = (event) => {
          if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
          }
          if (this.connectReject && !this.isConnected) {
            this.connectReject(new Error(`Connection closed before handshake (code: ${event.code})`));
            this.connectResolve = null;
            this.connectReject = null;
          }
          this.isConnected = false;
          this.stopHeartbeat();
          this.onDisconnected?.();
          this.handleReconnect();
        };

        ws.onerror = (error) => {
          this.onError?.(error);
        };

        ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  request<T = unknown>(msgId: number, params: RequestParams = {}): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.isConnected || this.ws.readyState !== WebSocket.OPEN) {
        console.warn('[WS] request failed: not connected, isConnected=', this.isConnected, 'readyState=', this.ws?.readyState);
        if (this.isConnected) {
          this.isConnected = false;
          this.stopHeartbeat();
          this.onDisconnected?.();
        }
        reject(new Error('Not connected'));
        return;
      }

      const requestId = ++this.requestId;

      const payloadStr = Object.keys(params).length > 0 ? JSON.stringify(params) : '';
      const payloadBytes = payloadStr ? encodeUtf8(payloadStr) : new Uint8Array(0);

      // 按照后端要求的格式：[MsgType][MsgID][Payload]
      const message = new Uint8Array(3 + payloadBytes.length);
      message[0] = MsgType.Request;
      message[1] = (msgId >> 8) & 0xff;
      message[2] = msgId & 0xff;
      if (payloadBytes.length > 0) {
        message.set(payloadBytes, 3);
      }

      console.log('[WS] sending request: msgId=', msgId, 'payload=', payloadStr || '(empty)', 'bytes=', message);

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        console.error('[WS] request timeout: msgId=', msgId, 'rid=', requestId);
        reject(new Error('Request timeout'));
      }, 10000);

      this.pendingRequests.set(requestId, {
        resolve: resolve as (r: ApiResponse) => void,
        reject,
        timeout,
      });

      this.ws.send(message);
    });
  }

  on<T = unknown>(msgId: number, callback: EventCallback<T>): () => void {
    if (!this.eventHandlers.has(msgId)) {
      this.eventHandlers.set(msgId, new Set());
    }
    this.eventHandlers.get(msgId)!.add(callback as EventCallback);

    return () => {
      this.eventHandlers.get(msgId)?.delete(callback as EventCallback);
    };
  }

  off(msgId: number, callback: EventCallback): void {
    this.eventHandlers.get(msgId)?.delete(callback);
  }

  private handleMessage(data: string | Blob | ArrayBuffer): void {
    try {
      if (typeof data === 'string') {
        return;
      }

      let buf: ArrayBuffer;
      if (data instanceof Blob) {
        data.arrayBuffer().then((ab) => this.handleMessage(ab));
        return;
      }
      buf = data as ArrayBuffer;

      const view = new Uint8Array(buf);
      if (view.length < 1) return;

      // 检查是否有长度前缀（4字节）
      // 注意：握手响应没有长度前缀，格式为 [0x02, 0x00, 0x00, 0x00, 0x00]
      let offset = 0;
      if (view.length >= 4 && !(view[0] === 0x02 && view.length === 5)) {
        // 读取长度前缀（4字节）
        const length = (view[0] << 24) | (view[1] << 16) | (view[2] << 8) | view[3];
        offset = 4;
        console.log('[WS] received message with length prefix:', length);
      }

      if (offset >= view.length) return;

      const msgType = view[offset];
      console.log('[WS] received binary message, type=', msgType, 'length=', view.length, 'offset=', offset, 'hex=', Array.from(view.slice(offset, offset + 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));

      if (msgType === MsgType.Response) {
        // 服务端响应格式: [Length(4B)][MsgType(0x02)][JSON payload]
        // 注意：服务端响应不包含 MsgID 字段

        if (!this.isConnected) {
          console.log('[WS] handshake response received, connection established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.onConnected?.();
          if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
          }
          if (this.connectResolve) {
            this.connectResolve();
            this.connectResolve = null;
            this.connectReject = null;
          }
          return;
        }

        // 使用 FIFO 匹配请求（因为服务端响应没有 MsgID/RID 字段）
        let matchedCallback: RequestCallback | undefined;
        for (const [, callback] of this.pendingRequests.entries()) {
          matchedCallback = callback;
          break;
        }

        if (matchedCallback) {
          clearTimeout(matchedCallback.timeout);
          this.pendingRequests.delete(Array.from(this.pendingRequests.keys())[0]);

          let response: ApiResponse;
          // payload 紧跟 MsgType 之后，即 view.slice(offset + 1)
          if (view.length > offset + 1) {
            const payloadStr = decodeUtf8(view.slice(offset + 1));
            console.log('[WS] response payload:', payloadStr);
            try {
              response = JSON.parse(payloadStr) as ApiResponse;
            } catch {
              response = { code: 0, message: 'ok', data: payloadStr };
            }
          } else {
            response = { code: 0, message: 'ok' };
          }

          matchedCallback.resolve(response);
          return;
        }

        console.warn('Received response for unknown request');
      }

      if (msgType === MsgType.Push) {
        if (view.length < offset + 3) return;

        const msgId = (view[offset + 1] << 8) | (view[offset + 2]);

        const handlers = this.eventHandlers.get(msgId);
        if (handlers) {
          let pushData: unknown;
          if (view.length > offset + 3) {
            const payloadStr = decodeUtf8(view.slice(offset + 3));
            try {
              pushData = JSON.parse(payloadStr);
            } catch {
              pushData = payloadStr;
            }
          } else {
            pushData = {};
          }
          handlers.forEach((handler) => handler(pushData));
        }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected || !this.ws) {
        return;
      }
      try {
        // 按照后端要求的格式：[MsgType][MsgID][Payload]
        const message = new Uint8Array(3);
        message[0] = MsgType.Request;
        message[1] = (MsgID.Role.Heartbeat >> 8) & 0xff;
        message[2] = MsgID.Role.Heartbeat & 0xff;
        this.ws.send(message);
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
        if (this.isConnected) {
          this.connect().catch(console.error);
        }
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleReconnect(): void {
    if (!this.shouldReconnect) return;
    if (!this.config.reconnect) return;
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) return;
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(console.error);
    }, this.config.reconnectInterval);
  }
}

export class GameAPI {
  constructor(private client: WSClient) {}

  login() {
    return this.client.request(MsgID.Role.Login);
  }

  getRoleInfo() {
    return this.client.request(MsgID.Role.GetInfo);
  }

  getItems() {
    return this.client.request(MsgID.Item.List);
  }

  useItem(itemId: number, count: number = 1) {
    return this.client.request(MsgID.Item.Use, { item_id: itemId, count });
  }

  enterScene(sceneId: number, x?: number, y?: number) {
    const params: Record<string, unknown> = { scene_id: sceneId };
    if (x !== undefined && y !== undefined) {
      params.x = x;
      params.y = y;
    }
    return this.client.request(MsgID.Scene.Enter, params);
  }

  move(x: number, y: number) {
    return this.client.request(MsgID.Scene.Move, { x, y });
  }

  leaveScene() {
    return this.client.request(MsgID.Scene.Leave);
  }

  getNearby(sceneId?: number) {
    const params: Record<string, unknown> = {};
    if (sceneId !== undefined) {
      params.scene_id = sceneId;
    }
    return this.client.request(MsgID.Scene.GetNearby, params);
  }

  getSceneInfo(sceneId: number) {
    return this.client.request(MsgID.Scene.GetSceneInfo, { scene_id: sceneId });
  }

  createArmy(heroId: number, soldiers: Record<number, number>, sceneId: number, x: number, y: number) {
    return this.client.request(MsgID.March.CreateArmy, {
      hero_id: heroId,
      soldiers,
      scene_id: sceneId,
      x,
      y,
    });
  }

  deleteArmy(armyId: number) {
    return this.client.request(MsgID.March.DeleteArmy, { army_id: armyId });
  }

  getArmies() {
    return this.client.request(MsgID.March.GetArmies);
  }

  startMarch(armyId: number, marchType: number, targetId: number) {
    return this.client.request(MsgID.March.StartMarch, {
      army_id: armyId,
      march_type: marchType,
      target_id: targetId,
    });
  }

  cancelMarch(armyId: number) {
    return this.client.request(MsgID.March.CancelMarch, { army_id: armyId });
  }

  getSoldiers() {
    return this.client.request(MsgID.Soldier.List);
  }

  getSoldierConfigs() {
    return this.client.request(MsgID.Soldier.Configs);
  }

  trainSoldier(type: number, level: number, count: number, isUpgrade = false) {
    return this.client.request(MsgID.Soldier.Train, {
      type,
      level,
      count,
      is_upgrade: isUpgrade,
    });
  }

  cancelTrain(queueId: number) {
    return this.client.request(MsgID.Soldier.CancelTrain, { queue_id: queueId });
  }

  getTrainQueue() {
    return this.client.request(MsgID.Soldier.TrainQueue);
  }

  completeTrain() {
    return this.client.request(MsgID.Soldier.CompleteTrain);
  }

  healSoldiers(soldiers: Array<{ soldier_id: number; count: number }>) {
    return this.client.request(MsgID.Soldier.Heal, { soldiers });
  }

  getHealQueue() {
    return this.client.request(MsgID.Soldier.HealQueue);
  }

  completeHeal() {
    return this.client.request(MsgID.Soldier.CompleteHeal);
  }

  dismissSoldier(soldierId: number, count: number) {
    return this.client.request(MsgID.Soldier.Dismiss, {
      soldier_id: soldierId,
      count,
    });
  }

  getSoldierStats() {
    return this.client.request(MsgID.Soldier.Stats);
  }

  getCityInfo() {
    return this.client.request<CityInfoResponse>(MsgID.City.GetInfo);
  }

  upgradeBuilding(buildingType: number) {
    return this.client.request<UpgradeBuildingResponse>(MsgID.City.Upgrade, {
      building_type: buildingType,
    });
  }

  cancelBuild(queueId: number) {
    return this.client.request<CancelBuildResponse>(MsgID.City.CancelBuild, {
      queue_id: queueId,
    });
  }

  getBuildQueue() {
    return this.client.request<BuildQueueResponse>(MsgID.City.BuildQueue);
  }

  getCityProduction() {
    return this.client.request<CityProductionResponse>(MsgID.City.Production);
  }
}
