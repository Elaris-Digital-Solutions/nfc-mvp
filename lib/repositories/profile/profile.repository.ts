import type { Database } from '@/types/database'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ActionButtonRow = Database['public']['Tables']['action_buttons']['Row']
export type UsernameConflictRow = Pick<ProfileRow, 'id'>

export type RepositoryResult<T> = {
  data: T | null
  error: string | null
}

export interface ProfileRepository {
  findById(profileId: string): Promise<RepositoryResult<ProfileRow>>
  findByUsername(username: string): Promise<RepositoryResult<ProfileRow>>
  findUsernameConflict(
    username: string,
    excludingProfileId: string
  ): Promise<RepositoryResult<UsernameConflictRow>>
  updateById(
    profileId: string,
    payload: ProfileUpdate,
    expectedUpdatedAt?: string
  ): Promise<RepositoryResult<ProfileRow>>
  listActiveLinks(profileId: string): Promise<RepositoryResult<ActionButtonRow[]>>
}