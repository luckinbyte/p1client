import type { Position } from '@/sdk'

export function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }

  return num.toString()
}

export function formatTime(seconds: number): string {
  if (seconds <= 0) {
    return '00:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatResources(resources: {
  food: number
  wood: number
  stone: number
  gold: number
}): string {
  return `🌾${formatNumber(resources.food)} 🪵${formatNumber(resources.wood)} 🪨${formatNumber(resources.stone)} 🪙${formatNumber(resources.gold)}`
}

export function gameToThree(
  pos: Position,
  mapWidth: number,
  mapHeight: number,
): { x: number; y: number; z: number } {
  return {
    x: pos.x - mapWidth / 2,
    y: 0,
    z: pos.y - mapHeight / 2,
  }
}

export function threeToGame(x: number, z: number, mapWidth: number, mapHeight: number): Position {
  return {
    x: Math.floor(x + mapWidth / 2),
    y: Math.floor(z + mapHeight / 2),
  }
}

export function calculateMarchTime(from: Position, to: Position, speed: number): number {
  const dist = distance(from, to)
  return Math.ceil((dist / speed) * 60)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
