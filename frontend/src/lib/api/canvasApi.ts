import type { CanvasSummaryDto, CreateCanvasRequest } from '../protocol/messages'

export class CanvasHasActiveUsersError extends Error {
  constructor(canvasId: string) {
    super(`Canvas ${canvasId} has active users and cannot be deleted`)
    this.name = 'CanvasHasActiveUsersError'
  }
}

export class CanvasNotFoundError extends Error {
  constructor(canvasId: string) {
    super(`Canvas ${canvasId} was not found`)
    this.name = 'CanvasNotFoundError'
  }
}

export async function listCanvases(): Promise<CanvasSummaryDto[]> {
  const response = await fetch('/api/canvases')
  if (!response.ok) {
    throw new Error(`Failed to list canvases: ${response.status}`)
  }
  return response.json()
}

export async function createCanvas(name: string): Promise<CanvasSummaryDto> {
  const response = await fetch('/api/canvases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name } satisfies CreateCanvasRequest),
  })
  if (!response.ok) {
    throw new Error(`Failed to create canvas: ${response.status}`)
  }
  return response.json()
}

export async function deleteCanvas(id: string): Promise<void> {
  const response = await fetch(`/api/canvases/${id}`, { method: 'DELETE' })
  if (response.status === 409) {
    throw new CanvasHasActiveUsersError(id)
  }
  if (response.status === 404) {
    throw new CanvasNotFoundError(id)
  }
  if (!response.ok) {
    throw new Error(`Failed to delete canvas: ${response.status}`)
  }
}
