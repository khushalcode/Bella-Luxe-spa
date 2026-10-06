'use server'

import { supabase } from '@/lib/supabaseServer'
import type { PackageDTO } from '@/lib/types'

interface PackageRow {
  id: string
  title: string
  type: string
  discount_value: number
  discount_type: string
  valid_from: string
  valid_to: string
  code: string
  is_active: boolean
  created_at: string
}

function toDTO(r: PackageRow): PackageDTO {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    discountValue: r.discount_value,
    discountType: r.discount_type,
    validFrom: r.valid_from,
    validTo: r.valid_to,
    code: r.code,
    isActive: r.is_active,
  }
}

export async function getPackages(): Promise<PackageDTO[]> {
  const { data, error } = await supabase
    .from('package_offers')
    .select('*')
    .order('valid_from', { ascending: false })
  if (error) throw new Error(`Failed to load packages: ${error.message}`)
  return (data as PackageRow[]).map(toDTO)
}

export interface CreatePackageInput {
  title: string
  type: string
  discountValue: number
  discountType: string
  validFrom: string
  validTo: string
  code: string
  isActive?: boolean
}

export async function createPackage(input: CreatePackageInput): Promise<PackageDTO> {
  const { data, error } = await supabase
    .from('package_offers')
    .insert({
      title: input.title,
      type: input.type,
      discount_value: input.discountValue,
      discount_type: input.discountType,
      valid_from: input.validFrom,
      valid_to: input.validTo,
      code: input.code,
      is_active: input.isActive ?? true,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create package: ${error.message}`)
  return toDTO(data as PackageRow)
}

export async function togglePackage(id: string): Promise<{ ok: true; isActive: boolean }> {
  const { data: cur, error: e1 } = await supabase
    .from('package_offers')
    .select('is_active')
    .eq('id', id)
    .single()
  if (e1 || !cur) throw new Error('Package not found')
  const next = !(cur as any).is_active
  const { error: e2 } = await supabase
    .from('package_offers')
    .update({ is_active: next })
    .eq('id', id)
  if (e2) throw new Error(`Failed to toggle package: ${e2.message}`)
  return { ok: true, isActive: next }
}

export async function deletePackage(id: string): Promise<{ ok: true }> {
  const { error } = await supabase.from('package_offers').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete package: ${error.message}`)
  return { ok: true }
}
