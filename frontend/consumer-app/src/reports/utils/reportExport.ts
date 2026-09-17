export function exportCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: string; label: string }[],
  filename: string,
): void {
  if (rows.length === 0) return

  const header = columns.map((c) => `"${c.label}"`).join(',')

  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c.key]
          const str = val == null ? '' : String(val)
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(','),
    )
    .join('\n')

  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
