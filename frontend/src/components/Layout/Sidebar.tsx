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
      background: '#fafafa',
      borderRight: '1px solid #e8e8e8',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {children}
    </div>
  )
}
