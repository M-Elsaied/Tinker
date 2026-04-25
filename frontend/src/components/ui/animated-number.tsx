import { useEffect, useState } from 'react'
import CountUp from 'react-countup'

interface Props {
  value: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
}

export function AnimatedNumber({ value, decimals = 2, duration = 0.6, prefix, suffix }: Props) {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const handler = () => setReduce(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  if (reduce || !Number.isFinite(value)) {
    return <>{prefix}{Number.isFinite(value) ? value.toFixed(decimals) : '—'}{suffix}</>
  }
  return (
    <CountUp
      end={value}
      decimals={decimals}
      duration={duration}
      prefix={prefix}
      suffix={suffix}
      preserveValue
      separator=""
    />
  )
}
