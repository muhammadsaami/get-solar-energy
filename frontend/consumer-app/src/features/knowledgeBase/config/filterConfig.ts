export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  id: string
  label: string
  accessor: 'category' | 'equipment' | 'difficulty'
  options: FilterOption[]
}

export const FILTER_CONFIG: FilterConfig[] = [
  {
    id: 'category',
    label: 'Category',
    accessor: 'category',
    options: [
      { value: 'Safety', label: 'Safety' },
      { value: 'Installation', label: 'Installation' },
      { value: 'Technical', label: 'Technical' },
      { value: 'Compliance', label: 'Compliance' },
    ],
  },
  {
    id: 'equipment',
    label: 'Equipment',
    accessor: 'equipment',
    options: [
      { value: 'Inverter', label: 'Inverter' },
      { value: 'Module', label: 'Module' },
      { value: 'Battery', label: 'Battery' },
      { value: 'None', label: 'General' },
    ],
  },
  {
    id: 'difficulty',
    label: 'Difficulty',
    accessor: 'difficulty',
    options: [
      { value: 'Beginner', label: 'Beginner' },
      { value: 'Intermediate', label: 'Intermediate' },
      { value: 'Advanced', label: 'Advanced' },
    ],
  },
]
