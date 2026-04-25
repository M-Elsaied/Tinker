import { toast as sonnerToast } from 'sonner'
import type { ReactNode } from 'react'

interface CommonOpts {
  description?: ReactNode
  duration?: number
  action?: { label: string; onClick: () => void }
}

export const toast = {
  success(message: string, opts?: CommonOpts) {
    return sonnerToast.success(message, opts)
  },
  error(message: string, opts?: CommonOpts) {
    return sonnerToast.error(message, opts)
  },
  info(message: string, opts?: CommonOpts) {
    return sonnerToast(message, opts)
  },
  loading(message: string, opts?: CommonOpts) {
    return sonnerToast.loading(message, opts)
  },
  promise<T>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) {
    return sonnerToast.promise(p, msgs)
  },
  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id)
  },
}
