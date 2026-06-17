import Header from '../components/Layout/Header'
import Sidebar from '../components/Layout/Sidebar'
import Timeline from '../components/Timeline/Timeline'
import VariableSelector from '../components/VariableSelector/VariableSelector'
import MapViewer from '../components/MapViewer/MapViewer'
import DataPanel from '../components/DataPanel/DataPanel'
import DownloadPanel from '../components/DownloadPanel/DownloadPanel'

export default function HomePage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <Sidebar>
          <Timeline />
          <VariableSelector />
          <DownloadPanel />
        </Sidebar>
        {/* Main content: map + data panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <MapViewer />
          <DataPanel />
        </div>
      </div>
    </div>
  )
}
