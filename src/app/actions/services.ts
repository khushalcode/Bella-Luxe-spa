'use server'

import { db } from '@/lib/db'
import type { ServiceDTO } from '@/lib/types'

function toDTO(s: any): ServiceDTO {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    durationMin: s.durationMin,
    price: s.price,
    isActive: s.isActive,
  }
}

export async function getServices(): Promise<ServiceDTO[]> {
  const rows = await db.service.findMany({ orderBy: { category: 'asc' } })
  return rows.map(toDTO)
}

export interface CreateServiceInput {
  name: string
  category: string
  durationMin: number
  price: number
  isActive?: boolean
}

export async function createService(input: CreateServiceInput): Promise<ServiceDTO> {
  const s = await db.service.create({
    data: {
      name: input.name,
      category: input.category,
      durationMin: input.durationMin,
      price: input.price,
      isActive: input.isActive ?? true,
    },
  })
  return toDTO(s)
}

export async function updateService(id: string, patch: Partial<CreateServiceInput>): Promise<ServiceDTO> {
  const s = await db.service.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.durationMin !== undefined ? { durationMin: patch.durationMin } : {}),
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    },
  })
  return toDTO(s)
}

export async function toggleService(id: string): Promise<{ ok: true; isActive: boolean }> {
  const s = await db.service.findUnique({ where: { id } })
  if (!s) throw new Error('Service not found')
  const updated = await db.service.update({
    where: { id },
    data: { isActive: !s.isActive },
  })
  return { ok: true, isActive: updated.isActive }
}

export async function deleteService(id: string): Promise<{ ok: true }> {
  await db.service.delete({ where: { id } })
  return { ok: true }
}
