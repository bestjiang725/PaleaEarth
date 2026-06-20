import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useMapStore } from '../../stores/mapStore'
import { queryPoint } from '../../api/queryApi'
import { formatValue } from '../../utils/format'
import { Spin, Tag } from 'antd'
import { AimOutlined, PlusOutlined, MinusOutlined, ExpandOutlined } from '@ant-design/icons'
import type { ApiResponse, PointQueryResult } from '../../types/api'

export default function MapViewer() {
  const selectedAgeMa = useAppStore((s) => s.selectedAgeMa)
  const selectedVarName = useAppStore((s) => s.selectedVarName)
  const overlayOpacity = useMapStore((s) => s.overlayOpacity)
  const setOverlayOpacity = useMapStore((s) => s.setOverlayOpacity)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })

  const [clickedPoint, setClickedPoint] = useState<{
    lon: number; lat: number; loading: boolean; result: PointQueryResult | null
  } | null>(null)

  const overlayUrl = selectedAgeMa != null && selectedVarName
    ? `/api/v1/tiles/overlay/${selectedAgeMa}/${selectedVarName}.png`
    : null

  useEffect(() => { setImgLoaded(false); setImgError(false) }, [overlayUrl])

  const screenToWorld = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const containerW = rect.width; const containerH = rect.height
    const imgW = containerW * zoom; const imgH = containerH * zoom
    const offsetX = panX + (imgW - containerW) / 2
    const offsetY = panY + (imgH - containerH) / 2
    const imgX = (clientX - rect.left + offsetX) / imgW
    const imgY = (clientY - rect.top + offsetY) / imgH
    return {
      lon: Math.max(-180, Math.min(180, imgX * 360 - 180)),
      lat: Math.max(-90, Math.min(90, 90 - imgY * 180)),
    }
  }, [zoom, panX, panY])

  const handleMapClick = useCallback(
    async (e: React.MouseEvent) => {
      if (!selectedAgeMa || !selectedVarName) return
      const rect = e.currentTarget.getBoundingClientRect()
      const { lon, lat } = screenToWorld(e.clientX, e.clientY, rect)
      setClickedPoint({ lon, lat, loading: true, result: null })
      try {
        const res = await queryPoint(lon, lat, selectedAgeMa, selectedVarName) as ApiResponse<PointQueryResult>
        setClickedPoint({ lon, lat, loading: false, result: res.data })
      } catch { setClickedPoint({ lon, lat, loading: false, result: null }) }
    },
    [selectedAgeMa, selectedVarName, screenToWorld],
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return
    setIsPanning(true)
    panStart.current = { x: e.clientX - panX, y: e.clientY - panY }
  }, [zoom, panX, panY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPanX(e.clientX - panStart.current.x)
    setPanY(e.clientY - panStart.current.y)
  }, [isPanning])

  const handleMouseUp = useCallback(() => setIsPanning(false), [])
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 5))
  const handleZoomOut = () => { setZoom((z) => { if (z <= 1.5) { setPanX(0); setPanY(0); return 1 } return z - 0.5 }) }
  const handleReset = () => { setZoom(1); setPanX(0); setPanY(0) }
  const cursor = zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : (selectedAgeMa && selectedVarName ? 'crosshair' : 'default')

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0, background: '#0a1628' }}>
      {/* Status tags */}
      <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {selectedAgeMa != null && selectedVarName && (
          <Tag style={{ fontSize: 12, padding: '5px 14px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', color: '#93c5fd', borderRadius: 8 }}>
            {selectedAgeMa} Ma · {selectedVarName}
          </Tag>
        )}
        {selectedAgeMa == null && (
          <Tag style={{ fontSize: 12, padding: '5px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #192030', color: '#8899aa', borderRadius: 8 }}>选择地质年代</Tag>
        )}
        {!selectedVarName && (
          <Tag style={{ fontSize: 12, padding: '5px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #192030', color: '#8899aa', borderRadius: 8 }}>选择气候变量</Tag>
        )}
      </div>

      {/* Map */}
      <div
        style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor }}
        onClick={handleMapClick} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      >
        {/* Placeholder */}
        {!overlayUrl && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36, opacity: 0.8 }}>🌍</span>
            </div>
            <div style={{ fontSize: 20, color: '#8899aa', fontWeight: 300, textAlign: 'center' }}>DeepEarth</div>
            <div style={{ fontSize: 12, color: '#4a5568', textAlign: 'center' }}>选择地质年代与气候变量</div>
          </div>
        )}

        {/* Loading */}
        {overlayUrl && !imgLoaded && !imgError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,22,40,0.6)', pointerEvents: 'none' }}>
            <Spin size="large" />
          </div>
        )}

        {/* Zoomable layer */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: `${100 * zoom}%`, height: `${100 * zoom}%`,
          transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
          transition: isPanning ? 'none' : 'transform 0.2s ease, width 0.2s ease, height 0.2s ease',
          pointerEvents: 'none',
        }}>
          {overlayUrl && (
            <img
              key={overlayUrl}
              src={overlayUrl}
              alt={`${selectedVarName} at ${selectedAgeMa}Ma`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(false) }}
              style={{ width: '100%', height: '100%', opacity: imgLoaded ? overlayOpacity : 0, objectFit: 'fill', display: 'block' }}
            />
          )}
        </div>

        {/* Error */}
        {overlayUrl && imgError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,22,40,0.7)', color: '#ef4444', fontSize: 14, pointerEvents: 'none', flexDirection: 'column', gap: 6 }}>
            <span>⚠ 图像加载失败</span>
          </div>
        )}

        {/* Popup */}
        {clickedPoint && (
          <div style={{ position: 'absolute', left: `${((clickedPoint.lon + 180) / 360) * 100}%`, top: `${((90 - clickedPoint.lat) / 180) * 100}%`, transform: 'translate(-50%, -120%)', background: 'rgba(13,17,25,0.94)', border: '1px solid #192030', color: '#e6edf3', padding: '10px 16px', borderRadius: 10, fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 20, backdropFilter: 'blur(10px)' }}>
            <div style={{ color: '#8899aa', marginBottom: 2 }}><AimOutlined /> {clickedPoint.lon.toFixed(2)}°E, {clickedPoint.lat.toFixed(2)}°N</div>
            {clickedPoint.loading ? <Spin size="small" /> : clickedPoint.result ? (
              <div style={{ fontWeight: 600, fontSize: 15, color: '#93c5fd' }}>{formatValue(clickedPoint.result.value, clickedPoint.result.units)}</div>
            ) : <div style={{ color: '#ef4444' }}>无数据</div>}
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 2, background: 'rgba(13,17,25,0.9)', borderRadius: 10, border: '1px solid #192030', padding: 4, backdropFilter: 'blur(10px)' }}>
        {[{ icon: PlusOutlined, fn: handleZoomIn }, { icon: MinusOutlined, fn: handleZoomOut }, { icon: ExpandOutlined, fn: handleReset }].map(({ icon: Icon, fn }, i) => (
          <button key={i} onClick={fn} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1e2a3a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <Icon style={{ fontSize: 14, color: '#8899aa' }} />
          </button>
        ))}
      </div>

      {/* Zoom level */}
      {zoom > 1 && (
        <div style={{ position: 'absolute', bottom: 124, right: 22, zIndex: 10, color: '#8899aa', fontSize: 11, pointerEvents: 'none', fontFamily: "'Fira Code', monospace" }}>{Math.round(zoom * 100)}%</div>
      )}

      {/* Opacity */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, background: 'rgba(13,17,25,0.9)', borderRadius: 10, border: '1px solid #192030', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(10px)' }}>
        <span style={{ fontSize: 11, color: '#4a5568' }}>透明度</span>
        <input type="range" min={0} max={1} step={0.05} value={overlayOpacity} onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))} style={{ width: 72, accentColor: '#4d9fff' }} />
        <span style={{ color: '#93c5fd', fontFamily: "'Fira Code', monospace", fontSize: 11, width: 30 }}>{Math.round(overlayOpacity * 100)}%</span>
      </div>
    </div>
  )
}
