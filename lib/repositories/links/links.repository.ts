import type { Database } from '@/types/database'

export type ActionButtonRow = Database['public']['Tables']['action_buttons']['Row']
export type ActionButtonInsert = Database['public']['Tables']['action_buttons']['Insert']
export type ActionButtonUpdate = Database['public']['Tables']['action_buttons']['Update']
export type LinkIdRow = Pick<ActionButtonRow, 'id'>

export type RepositoryResult<T> = {
  data: T | null
  error: string | null
}

export interface LinksRepository {
  listActiveByProfileId(profileId: string): Promise<RepositoryResult<ActionButtonRow[]>>
  countActiveByProfileId(profileId: string): Promise<RepositoryResult<number>>
  findByIdForProfile(linkId: string, profileId: string): Promise<RepositoryResult<ActionButtonRow>>
  insert(payload: ActionButtonInsert): Promise<RepositoryResult<ActionButtonRow>>
  updateActiveByIdForProfile(
    linkId: string,
    profileId: string,
    payload: ActionButtonUpdate
  ): Promise<RepositoryResult<ActionButtonRow>>
  softDeleteByIdForProfile(linkId: string, profileId: string, deletedAt: string): Promise<RepositoryResult<LinkIdRow>>
}