import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  baseline?: number
  showLast?: boolean
  className?: string
}

export function Sparkline({
  values,
  width = 80,
  height = 24,
  stroke = 'hsl(var(--primary))',
  fill = 'hsl(var(--primary) / 0.15)',
  baseline,
  showLast = true,
  className,
}: Props) {
  const cleaned = values.filter((v) => Number.isFinite(v))
  const path = useMemo(() => buildPath(cleaned, width, height, baseline), [cleaned, width, height, baseline])
  if (cleaned.length < 2) return null
  const lastX = path.last?.x ?? 0
  const lastY = path.last?.y ?? 0
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('inline-block align-middle', className)}
      preserveAspectRatio="none"
    >
      {fill && <path d={path.area} fill={fill} />}
      <path d={path.line} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {showLast && <circle cx={lastX} cy={lastY} r={2} fill={stroke} />}
    </svg>
  )
}

function buildPath(values: number[], w: number, h: number, baseline?: number) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const padY = 2
  const usableH = h - padY * 2
  const stepX = w / (values.length - 1 || 1)
  const points = values.map((v, i) => {
    const x = i * stepX
    const y = padY + (1 - (v - min) / range) * usableH
    return { x, y }
  })
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const baseY = baseline !== undefined
    ? padY + (1 - (baseline - min) / range) * usableH
    : h - padY
  const area = `${line} L ${points[points.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} L ${points[0].x.toFixed(2)} ${baseY.toFixed(2)} Z`
  return { line, area, last: points[points.length - 1] }
}
