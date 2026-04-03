import type { Database } from '@/types/database'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type TemplateProfileSnapshot = Pick<ProfileRow, 'id' | 'updated_at' | 'deleted_at'>
export type TemplateUpdateSnapshot = Pick<ProfileRow, 'updated_at'>

export type RepositoryResult<T> = {
  data: T | null
  error: string | null
}

export interface TemplateRepository {
  findById(profileId: string): Promise<RepositoryResult<TemplateProfileSnapshot>>
  updateTemplateById(
    profileId: string,
    templateId: number,
    updatedAt: string,
    expectedUpdatedAt?: string
  ): Promise<RepositoryResult<TemplateUpdateSnapshot>>
}