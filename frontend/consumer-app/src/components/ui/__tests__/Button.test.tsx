import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click Me')
  })

  it('fires onClick handler', async () => {
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders with variant styles', () => {
    const { rerender } = render(<Button variant="danger">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
