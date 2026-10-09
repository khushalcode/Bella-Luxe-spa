'use server'

import { getSupabase, toISO } from '@/lib/supabaseServer'
import type { ServiceDTO } from '@/lib/types'

interface ServiceRow {
  id: string
  name: string
  category: string
  duration_min: number
  price: number
  is_active: boolean
  created_at: string
}

function toDTO(r: ServiceRow): ServiceDTO {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    durationMin: r.duration_min,
    price: r.price,
    isActive: r.is_active,
  }
}

export async function getServices(): Promise<ServiceDTO[]> {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('services')
    .select('*')
    .order('category', { ascending: true })
  if (error) throw new Error(`Failed to load services: ${error.message}`)
  return (data as ServiceRow[]).map(toDTO)
}

export interface CreateServiceInput {
  name: string
  category: string
  durationMin: number
  price: number
  isActive?: boolean
}

export async function createService(input: CreateServiceInput): Promise<ServiceDTO> {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('services')
    .insert({
      name: input.name,
      category: input.category,
      duration_min: input.durationMin,
      price: input.price,
      is_active: input.isActive ?? true,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create service: ${error.message}`)
  return toDTO(data as ServiceRow)
}

export async function updateService(id: string, patch: Partial<CreateServiceInput>): Promise<ServiceDTO> {
  const sb = await getSupabase()
  const update: Record<string, any> = {}
  if (patch.name !== undefined) update.name = patch.name
  if (patch.category !== undefined) update.category = patch.category
  if (patch.durationMin !== undefined) update.duration_min = patch.durationMin
  if (patch.price !== undefined) update.price = patch.price
  if (patch.isActive !== undefined) update.is_active = patch.isActive

  const { data, error } = await sb
    .from('services')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(`Failed to update service: ${error.message}`)
  return toDTO(data as ServiceRow)
}

export async function toggleService(id: string): Promise<{ ok: true; isActive: boolean }> {
  const sb = await getSupabase()
  const { data: cur, error: e1 } = await sb
    .from('services')
    .select('is_active')
    .eq('id', id)
    .single()
  if (e1 || !cur) throw new Error('Service not found')
  const next = !(cur as any).is_active
  const { error: e2 } = await sb
    .from('services')
    .update({ is_active: next })
    .eq('id', id)
  if (e2) throw new Error(`Failed to toggle service: ${e2.message}`)
  return { ok: true, isActive: next }
}

export async function deleteService(id: string): Promise<{ ok: true }> {
  const sb = await getSupabase()
  const { error } = await sb.from('services').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete service: ${error.message}`)
  return { ok: true }
}

// keep `toISO` referenced — used by other actions to normalize timestamptz strings
void toISO
