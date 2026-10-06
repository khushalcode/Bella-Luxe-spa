'use server'

import { db } from '@/lib/db'
import type { CampaignDTO } from '@/lib/types'

function toDTO(c: any): CampaignDTO {
  return {
    id: c.id,
    name: c.name,
    channel: c.channel,
    template: c.template,
    segment: c.segment,
    scheduledAt: c.scheduledAt ?? null,
    status: c.status,
    createdAt: c.createdAt?.toISOString?.() ?? String(c.createdAt),
  }
}

export async function getCampaigns(): Promise<CampaignDTO[]> {
  const rows = await db.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(toDTO)
}

export interface CreateCampaignInput {
  name: string
  channel: string
  template: string
  segment: string[]
  scheduledAt?: string | null
  status?: string
}

export async function createCampaign(input: CreateCampaignInput): Promise<CampaignDTO> {
  const c = await db.campaign.create({
    data: {
      name: input.name,
      channel: input.channel,
      template: input.template,
      segment: JSON.stringify(input.segment),
      scheduledAt: input.scheduledAt ?? null,
      status: input.status ?? 'Draft',
    },
  })
  return toDTO(c)
}

export async function sendCampaign(id: string): Promise<{ ok: true }> {
  await db.campaign.update({ where: { id }, data: { status: 'Sent' } })
  return { ok: true }
}

export async function deleteCampaign(id: string): Promise<{ ok: true }> {
  await db.campaign.delete({ where: { id } })
  return { ok: true }
}
