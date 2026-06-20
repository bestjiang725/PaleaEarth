import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useMapStore } from '../../stores/mapStore'
import { queryPoint } from '../../api/queryApi'
import { formatValue } from '../../utils/format'
import { Spin, Tag } from 'antd'
import { AimOutlined } from '@ant-design/icons'
import type { ApiResponse, PointQueryResult } from '../../types/api'

export default function MapViewer() {
  const selectedAgeMa = useAppStore((s) => s.selectedAgeMa)
  const selectedVarName = useAppStore((s) => s.selectedVarName)
  const overlayOpacity = useMapStore((s) => s.overlayOpacity)
  const setOverlayOpacity = useMapStore((s) => s.setOverlayOpacity)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [clickedPoint, setClickedPoint] = useState<{
    lon: number; lat: number; loading: boolean; result: PointQueryResult | null
  } | null>(null)

  const overlayUrl = selectedAgeMa != null && selectedVarName
    ? `/api/v1/tiles/overlay/${selectedAgeMa}/${selectedVarName}.png`
    : null

  useEffect(() => {
    setImgLoaded(false)
    setImgError(false)
  }, [overlayUrl])

  const handleMapClick = useCallback(
    async (lon: number, lat: number) => {
      if (!selectedAgeMa || !selectedVarName) return
      setClickedPoint({ lon, lat, loading: true, result: null })
      try {
        const res = await queryPoint(lon, lat, selectedAgeMa, selectedVarName) as ApiResponse<PointQueryResult>
        setClickedPoint({ lon, lat, loading: false, result: res.data })
      } catch {
        setClickedPoint({ lon, lat, loading: false, result: null })
      }
    },
    [selectedAgeMa, selectedVarName],
  )

  return (
    <div style={{
      flex: 1, position: 'relative', overflow: 'hidden',
      minHeight: 0, background: '#0a0d14',
    }}>
      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 10, left: 12, right: 12, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {selectedAgeMa != null && selectedVarName && (
          <Tag style={{
            fontSize: 12, padding: '4px 12px',
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa', borderRadius: 6,
          }}>
            {selectedAgeMa} Ma · {selectedVarName}
          </Tag>
        )}
        {selectedAgeMa == null && (
          <Tag style={{
            fontSize: 12, padding: '4px 12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2740',
            color: '#94a3b8', borderRadius: 6,
          }}>
            选择地质年代
          </Tag>
        )}
        {!selectedVarName && (
          <Tag style={{
            fontSize: 12, padding: '4px 12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2740',
            color: '#94a3b8', borderRadius: 6,
          }}>
            选择气候变量
          </Tag>
        )}
      </div>

      {/* Map area */}
      <div
        style={{
          width: '100%', height: '100%', position: 'relative',
          cursor: selectedAgeMa && selectedVarName ? 'crosshair' : 'default',
        }}
        onClick={(e) => {
          if (!selectedAgeMa || !selectedVarName) return
          const rect = e.currentTarget.getBoundingClientRect()
          const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
          const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
          const lon = x * 360 - 180
          const lat = 90 - y * 180
          handleMapClick(lon, lat)
        }}
      >
        {/* Placeholder — no overlay selected */}
        {!overlayUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', flexDirection: 'column', gap: 10,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 32, filter: 'grayscale(0.3)' }}>🌍</span>
            </div>
            <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 400 }}>DeepEarth</span>
            <span style={{ fontSize: 12, color: '#5a6677' }}>
              选择地质年代与气候变量以查看数据
            </span>
          </div>
        )}

        {/* Loading spinner */}
        {overlayUrl && !imgLoaded && !imgError && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', background: 'rgba(10,13,20,0.5)',
          }}>
            <Spin size="large" />
          </div>
        )}

        {/* Climate overlay image */}
        {overlayUrl && (
          <img
            key={overlayUrl}
            src={overlayUrl}
            alt={`${selectedVarName} at ${selectedAgeMa}Ma`}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(false); }}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              opacity: imgLoaded ? overlayOpacity : 0,
              objectFit: 'fill',
              pointerEvents: 'none',
              display: 'block',
            }}
          />
        )}

        {/* Error state */}
        {overlayUrl && imgError && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', fontSize: 14, pointerEvents: 'none',
            flexDirection: 'column', gap: 4, background: 'rgba(10,13,20,0.7)',
          }}>
            <span style={{ fontSize: 20, marginBottom: 4 }}>⚠</span>
            <span>图像加载失败</span>
          </div>
        )}

        {/* Point inspector popup */}
        {clickedPoint && (
          <div style={{
            position: 'absolute',
            left: `${((clickedPoint.lon + 180) / 360) * 100}%`,
            top: `${((90 - clickedPoint.lat) / 180) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: 'rgba(10,13,20,0.92)',
            border: '1px solid #1e2740',
            color: '#e2e8f0', padding: '8px 14px', borderRadius: 8,
            fontSize: 12, pointerEvents: 'none',
            whiteSpace: 'nowrap', zIndex: 20,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ color: '#94a3b8', marginBottom: 2 }}>
              <AimOutlined /> {clickedPoint.lon.toFixed(2)}°E, {clickedPoint.lat.toFixed(2)}°N
            </div>
            {clickedPoint.loading ? (
              <Spin size="small" />
            ) : clickedPoint.result ? (
              <div style={{ fontWeight: 600, fontSize: 14, color: '#60a5fa' }}>
                {formatValue(clickedPoint.result.value, clickedPoint.result.units)}
              </div>
            ) : (
              <div style={{ color: '#ef4444' }}>无数据</div>
            )}
          </div>
        )}
      </div>

      {/* Opacity control */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14, zIndex: 10,
        background: 'rgba(14,18,26,0.9)', borderRadius: 8,
        border: '1px solid #1e2740',
        padding: '8px 14px', fontSize: 11, display: 'flex',
        alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)',
        color: '#94a3b8',
      }}>
        <span style={{ color: '#5a6677' }}>透明度</span>
        <input
          type="range" min={0} max={1} step={0.05}
          value={overlayOpacity}
          onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
          style={{
            width: 70, accentColor: '#3b82f6',
            background: '#1e2740', height: 3, borderRadius: 2,
          }}
        />
        <span style={{ color: '#60a5fa', fontFamily: "'Fira Code', monospace", width: 28 }}>
          {Math.round(overlayOpacity * 100)}%
        </span>
      </div>
    </div>
  )
}
