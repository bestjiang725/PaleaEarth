import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ComparePage from './pages/ComparePage'
import TimeSeriesPage from './pages/TimeSeriesPage'
import DownloadPage from './pages/DownloadPage'
import DocsPage from './pages/DocsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/timeseries" element={<TimeSeriesPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
