import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
