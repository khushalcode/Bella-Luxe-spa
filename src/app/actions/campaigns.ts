'use server'

import { getSupabase, toISO } from '@/lib/supabaseServer'
import type { CampaignDTO } from '@/lib/types'

interface CampaignRow {
  id: string
  name: string
  channel: string
  template: string | null
  segment: any
  scheduled_at: string | null
  status: string
  created_at: string
}

function toDTO(r: CampaignRow): CampaignDTO {
  return {
    id: r.id,
    name: r.name,
    channel: r.channel,
    template: r.template ?? '',
    segment: typeof r.segment === 'string' ? r.segment : JSON.stringify(r.segment ?? []),
    scheduledAt: r.scheduled_at ?? null,
    status: r.status,
    createdAt: toISO(r.created_at),
  }
}

export async function getCampaigns(): Promise<CampaignDTO[]> {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to load campaigns: ${error.message}`)
  return (data as CampaignRow[]).map(toDTO)
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
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('campaigns')
    .insert({
      name: input.name,
      channel: input.channel,
      template: input.template,
      segment: input.segment,
      scheduled_at: input.scheduledAt ?? null,
      status: input.status ?? 'Draft',
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create campaign: ${error.message}`)
  return toDTO(data as CampaignRow)
}

export async function sendCampaign(id: string): Promise<{ ok: true }> {
  const sb = await getSupabase()
  const { error } = await sb
    .from('campaigns')
    .update({ status: 'Sent' })
    .eq('id', id)
  if (error) throw new Error(`Failed to send campaign: ${error.message}`)
  return { ok: true }
}

export async function deleteCampaign(id: string): Promise<{ ok: true }> {
  const sb = await getSupabase()
  const { error } = await sb.from('campaigns').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete campaign: ${error.message}`)
  return { ok: true }
}
