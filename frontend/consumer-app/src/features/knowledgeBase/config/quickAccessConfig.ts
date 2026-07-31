export interface QuickAccessItem {
  id: string
  label: string
  icon: string
  preset: {
    filters: Record<string, string[]>
    sortBy?: 'relevance' | 'updated' | 'popular' | 'rating'
    text?: string
  }
}

export const QUICK_ACCESS: QuickAccessItem[] = [
  {
    id: 'recent',
    label: 'Recent',
    icon: 'icon-clock',
    preset: { filters: {}, sortBy: 'updated' },
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    icon: 'icon-bookmark',
    preset: { filters: { bookmarked: ['true'] } },
  },
  {
    id: 'downloads',
    label: 'Downloads',
    icon: 'icon-download',
    preset: { filters: {}, sortBy: 'popular' },
  },
  {
    id: 'safety-sops',
    label: 'Safety SOPs',
    icon: 'icon-shield',
    preset: { filters: { category: ['Safety'] } },
  },
  {
    id: 'installation',
    label: 'Installation Guides',
    icon: 'icon-wrench',
    preset: { filters: { category: ['Installation'] } },
  },
  {
    id: 'offline',
    label: 'Offline Documents',
    icon: 'icon-cloud-off',
    preset: { filters: { offline: ['true'] }, sortBy: 'popular' },
  },
]
