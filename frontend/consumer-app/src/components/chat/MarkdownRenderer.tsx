import React from 'react'

interface MarkdownRendererProps {
  content: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(`[^`]+`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)))
    }

    if (match[1]) {
      parts.push(
        <code key={match.index} className="chat-inline-code">{match[1].slice(1, -1)}</code>
      )
    } else if (match[2]) {
      parts.push(<strong key={match.index}>{parseInline(match[3])}</strong>)
    } else if (match[4]) {
      parts.push(<em key={match.index}>{parseInline(match[5])}</em>)
    } else if (match[6]) {
      const href = match[8]
      parts.push(
        <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className="chat-link">
          {parseInline(match[7])}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)))
  }

  return parts
}

function parseTableLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (i === 0 && ch === '|') continue
    if (ch === '|') {
      cells.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) cells.push(current.trim())
  return cells
}

function isTableSeparator(cells: string[]): boolean {
  return cells.every(c => /^:?-+:?$/.test(c))
}

function parseMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inTable = false
  let tableHeaders: string[] = []
  let tableAlign: string[] = []
  let tableRows: string[][] = []
  let inCodeBlock = false
  let codeBlockContent = ''
  let listType: 'ul' | 'ol' | null = null
  let listItems: React.ReactNode[] = []
  let listStart = 1

  function flushList() {
    if (listItems.length === 0) return
    const ListTag = listType === 'ol' ? 'ol' : 'ul'
    elements.push(
      <ListTag key={`list-${elements.length}`} start={listType === 'ol' ? listStart : undefined} className="chat-list">
        {listItems}
      </ListTag>
    )
    listItems = []
    listType = null
  }

  function flushTable() {
    if (tableHeaders.length === 0 && tableRows.length === 0) return
    elements.push(
      <div key={`table-${elements.length}`} className="chat-table-wrapper">
        <table className="chat-table">
          {tableHeaders.length > 0 && (
            <thead>
              <tr>
                {tableHeaders.map((h, i) => (
                  <th key={i} style={{ textAlign: (tableAlign[i] as 'left' | 'center' | 'right') || 'left' }}>
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ textAlign: (tableAlign[ci] as 'left' | 'center' | 'right') || 'left' }}>
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableHeaders = []
    tableAlign = []
    tableRows = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (inCodeBlock) {
      if (trimmed.startsWith('```')) {
        inCodeBlock = false
        elements.push(
          <pre key={`code-${i}`} className="chat-code-block">
            <code>{escapeHtml(codeBlockContent)}</code>
          </pre>
        )
        codeBlockContent = ''
        continue
      }
      codeBlockContent += (codeBlockContent ? '\n' : '') + line
      continue
    }

    if (trimmed.startsWith('```')) {
      flushList()
      flushTable()
      inCodeBlock = true
      continue
    }

    if (trimmed === '') {
      flushList()
      flushTable()
      if (!inTable) {
        elements.push(<br key={`br-${i}`} />)
      }
      continue
    }

    if (inTable) {
      const cells = parseTableLine(trimmed)
      if (isTableSeparator(cells)) {
        tableAlign = cells.map(c => {
          if (c.startsWith(':') && c.endsWith(':')) return 'center'
          if (c.endsWith(':')) return 'right'
          if (c.startsWith(':')) return 'left'
          return 'left'
        })
        continue
      }
      tableRows.push(cells)
      continue
    }

    if (trimmed.startsWith('|')) {
      flushList()
      const cells = parseTableLine(trimmed)
      if (isTableSeparator(cells)) {
        tableAlign = cells.map(c => {
          if (c.startsWith(':') && c.endsWith(':')) return 'center'
          if (c.endsWith(':')) return 'right'
          if (c.startsWith(':')) return 'left'
          return 'left'
        })
        inTable = true
        continue
      }
      tableHeaders = cells
      inTable = true
      continue
    }

    inTable = false

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushList()
      flushTable()
      const level = headingMatch[1].length
      const headingText = headingMatch[2]
      const headingKey = `h-${i}`
      const headingClass = `chat-heading chat-h${level}`
      if (level === 1) {
        elements.push(<h1 key={headingKey} className={headingClass}>{parseInline(headingText)}</h1>)
      } else if (level === 2) {
        elements.push(<h2 key={headingKey} className={headingClass}>{parseInline(headingText)}</h2>)
      } else if (level === 3) {
        elements.push(<h3 key={headingKey} className={headingClass}>{parseInline(headingText)}</h3>)
      } else if (level === 4) {
        elements.push(<h4 key={headingKey} className={headingClass}>{parseInline(headingText)}</h4>)
      } else if (level === 5) {
        elements.push(<h5 key={headingKey} className={headingClass}>{parseInline(headingText)}</h5>)
      } else {
        elements.push(<h6 key={headingKey} className={headingClass}>{parseInline(headingText)}</h6>)
      }
      continue
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (olMatch) {
      flushTable()
      const num = parseInt(olMatch[1], 10)
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
        listStart = num
      }
      listItems.push(<li key={`li-${i}`}>{parseInline(olMatch[2])}</li>)
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      flushTable()
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      listItems.push(<li key={`li-${i}`}>{parseInline(trimmed.slice(2))}</li>)
      continue
    }

    flushList()
    flushTable()
    elements.push(
      <p key={`p-${i}`} className="chat-paragraph">
        {parseInline(trimmed)}
      </p>
    )
  }

  flushList()
  flushTable()

  if (inCodeBlock) {
    elements.push(
      <pre key={`code-end`} className="chat-code-block">
        <code>{escapeHtml(codeBlockContent)}</code>
      </pre>
    )
  }

  return <>{elements}</>
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return <>{parseMarkdown(content)}</>
}
