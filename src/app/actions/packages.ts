'use server'

import { db } from '@/lib/db'
import type { PackageDTO } from '@/lib/types'

function toDTO(p: any): PackageDTO {
  return {
    id: p.id,
    title: p.title,
    type: p.type,
    discountValue: p.discountValue,
    discountType: p.discountType,
    validFrom: p.validFrom,
    validTo: p.validTo,
    code: p.code,
    isActive: p.isActive,
  }
}

export async function getPackages(): Promise<PackageDTO[]> {
  const rows = await db.packageOffer.findMany({
    orderBy: { validFrom: 'desc' },
  })
  return rows.map(toDTO)
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
  const p = await db.packageOffer.create({
    data: {
      title: input.title,
      type: input.type,
      discountValue: input.discountValue,
      discountType: input.discountType,
      validFrom: input.validFrom,
      validTo: input.validTo,
      code: input.code,
      isActive: input.isActive ?? true,
    },
  })
  return toDTO(p)
}

export async function togglePackage(id: string): Promise<{ ok: true; isActive: boolean }> {
  const p = await db.packageOffer.findUnique({ where: { id } })
  if (!p) throw new Error('Package not found')
  const updated = await db.packageOffer.update({
    where: { id },
    data: { isActive: !p.isActive },
  })
  return { ok: true, isActive: updated.isActive }
}

export async function deletePackage(id: string): Promise<{ ok: true }> {
  await db.packageOffer.delete({ where: { id } })
  return { ok: true }
}
