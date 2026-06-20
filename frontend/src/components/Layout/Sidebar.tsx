import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  width?: number
}

export default function Sidebar({ children, width = 320 }: Props) {
  return (
    <div style={{
      width,
      minWidth: width,
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: '#0d1117',
      borderRight: '1px solid #1e2740',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {children}
    </div>
  )
}
