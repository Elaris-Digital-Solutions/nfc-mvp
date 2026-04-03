import type { SaveStatus } from '@/features/dashboard/use-dashboard-controller'

export function buildDashboardStatusClass(status: SaveStatus): string {
  if (status.state === 'error') {
    return 'text-red-400'
  }

  if (status.state === 'success') {
    return 'text-emerald-400'
  }

  return 'text-muted-foreground'
}
