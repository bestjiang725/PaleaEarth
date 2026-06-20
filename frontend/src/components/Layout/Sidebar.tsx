import type { ReactNode } from 'react'

export default function Sidebar({ children }: { children: ReactNode }) {
  return (
    <div style={{
      width: 340, minWidth: 340, height: '100%',
      overflowY: 'auto', overflowX: 'hidden',
      background: '#0b0f17',
      borderRight: '1px solid #192030',
      display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  )
}
