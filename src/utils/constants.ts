export const MAP_CONFIG = {
  width: 500,
  height: 500,
  tileSize: 1,
} as const

export const CAMERA_CONFIG = {
  angle: Math.PI / 6,
  minZoom: 0.5,
  maxZoom: 3,
  defaultZoom: 1,
} as const

export const COLORS = {
  grass: 0x3d5c3d,
  food: 0x4caf50,
  wood: 0x8b4513,
  stone: 0x808080,
  gold: 0xffd700,
  friendly: 0x2196f3,
  enemy: 0xf44336,
  neutral: 0x9e9e9e,
  selection: 0x00ff00,
  marchPath: 0xffff00,
} as const

export const ENTITY_TYPES = {
  PLAYER: 'player',
  RESOURCE: 'resource',
  MONSTER: 'monster',
  CITY: 'city',
  BUILDING: 'building',
} as const

export const RESOURCE_TYPE_MAP: Record<number, { name: string; color: number; icon: string }> = {
  1: { name: '粮食', color: COLORS.food, icon: '🌾' },
  2: { name: '木材', color: COLORS.wood, icon: '🪵' },
  3: { name: '石材', color: COLORS.stone, icon: '🪨' },
  4: { name: '金币', color: COLORS.gold, icon: '🪙' },
}

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const
