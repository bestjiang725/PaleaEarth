import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useMapStore } from '../../stores/mapStore'
import { queryPoint } from '../../api/queryApi'
import { formatValue } from '../../utils/format'
import { Spin, Tag } from 'antd'
import { EnvironmentOutlined } from '@ant-design/icons'
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
      minHeight: 0, background: '#d4e8f0',
    }}>
      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 8, left: 8, right: 8, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {selectedAgeMa != null && selectedVarName && (
          <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>
            {selectedAgeMa} Ma · {selectedVarName}
          </Tag>
        )}
        {selectedAgeMa == null && (
          <Tag color="default" style={{ fontSize: 13 }}>
            请选择一个地质年代
          </Tag>
        )}
        {!selectedVarName && (
          <Tag color="default" style={{ fontSize: 13 }}>
            请选择一个气候变量
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
        {/* Placeholder */}
        {!overlayUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#91c8d8', fontSize: 20, pointerEvents: 'none',
            flexDirection: 'column', gap: 8,
          }}>
            <span>🌍 古地球气候可视化</span>
            <span style={{ fontSize: 13, color: '#aaa' }}>
              请选择地质年代和气候变量以查看数据
            </span>
          </div>
        )}

        {/* Loading state */}
        {overlayUrl && !imgLoaded && !imgError && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
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
            color: '#ff4d4f', fontSize: 14, pointerEvents: 'none',
            flexDirection: 'column', gap: 4,
          }}>
            <span>⚠️ 图像加载失败</span>
            <span style={{ fontSize: 11, color: '#999' }}>请尝试其他变量</span>
          </div>
        )}

        {/* Point inspector popup */}
        {clickedPoint && (
          <div style={{
            position: 'absolute',
            left: `${((clickedPoint.lon + 180) / 360) * 100}%`,
            top: `${((90 - clickedPoint.lat) / 180) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: 'rgba(0,0,0,0.85)', color: '#fff',
            padding: '6px 12px', borderRadius: 6,
            fontSize: 12, pointerEvents: 'none',
            whiteSpace: 'nowrap', zIndex: 20,
          }}>
            <div>
              <EnvironmentOutlined /> ({clickedPoint.lon.toFixed(2)}°, {clickedPoint.lat.toFixed(2)}°)
            </div>
            {clickedPoint.loading ? (
              <div><Spin size="small" /> 查询中...</div>
            ) : clickedPoint.result ? (
              <div style={{ fontWeight: 600, marginTop: 2 }}>
                {formatValue(clickedPoint.result.value, clickedPoint.result.units)}
              </div>
            ) : (
              <div style={{ color: '#ff4d4f' }}>无数据</div>
            )}
          </div>
        )}
      </div>

      {/* Opacity control */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', borderRadius: 8,
        padding: '6px 12px', fontSize: 12, display: 'flex',
        alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>
        <span>透明度</span>
        <input
          type="range" min={0} max={1} step={0.05}
          value={overlayOpacity}
          onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
          style={{ width: 80 }}
        />
        <span>{Math.round(overlayOpacity * 100)}%</span>
      </div>
    </div>
  )
}
