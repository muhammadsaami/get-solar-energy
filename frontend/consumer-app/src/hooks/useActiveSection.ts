import { useState, useEffect } from 'react'

export function useActiveSection(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (sectionIds.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-150px 0px -40% 0px' },
    )

    const elements: Element[] = []
    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) {
        observer.observe(el)
        elements.push(el)
      }
    }

    return () => {
      for (const el of elements) {
        observer.unobserve(el)
      }
    }
  }, [sectionIds])

  return activeId
}
