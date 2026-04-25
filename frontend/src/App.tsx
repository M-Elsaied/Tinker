import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { NewDesignPage } from '@/pages/NewDesignPage'
import { DesignPage } from '@/pages/DesignPage'
import { DataPage } from '@/pages/DataPage'
import { AnalysisPage } from '@/pages/AnalysisPage'
import { OptimizePage } from '@/pages/OptimizePage'
import { OverlayPage } from '@/pages/OverlayPage'
import { AboutPage } from '@/pages/AboutPage'
import { CustomGraphsPage } from '@/pages/CustomGraphsPage'
import { PointPredictionPage } from '@/pages/PointPredictionPage'
import { ProfilerPage } from '@/pages/ProfilerPage'
import { ConfirmationPage } from '@/pages/ConfirmationPage'
import { RampsPage } from '@/pages/RampsPage'
import { NotesPage } from '@/pages/NotesPage'
import { EvaluationPage } from '@/pages/EvaluationPage'
import { ReportPage } from '@/pages/ReportPage'

export function App() {
  const location = useLocation()
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<ScrollPage><HomePage /></ScrollPage>} />
          <Route path="/new" element={<ScrollPage><NewDesignPage /></ScrollPage>} />
          <Route path="/project/design" element={<ScrollPage><DesignPage /></ScrollPage>} />
          <Route path="/project/data" element={<ScrollPage><DataPage /></ScrollPage>} />
          <Route path="/project/analysis" element={<MotionWrap><AnalysisPage /></MotionWrap>} />
          <Route path="/project/analysis/:tab" element={<MotionWrap><AnalysisPage /></MotionWrap>} />
          <Route path="/project/optimize" element={<ScrollPage><OptimizePage /></ScrollPage>} />
          <Route path="/project/overlay" element={<ScrollPage><OverlayPage /></ScrollPage>} />
          <Route path="/project/ramps" element={<ScrollPage><RampsPage /></ScrollPage>} />
          <Route path="/project/notes" element={<ScrollPage><NotesPage /></ScrollPage>} />
          <Route path="/project/evaluation" element={<ScrollPage><EvaluationPage /></ScrollPage>} />
          <Route path="/project/prediction" element={<ScrollPage><PointPredictionPage /></ScrollPage>} />
          <Route path="/project/profiler" element={<ScrollPage><ProfilerPage /></ScrollPage>} />
          <Route path="/project/confirmation" element={<ScrollPage><ConfirmationPage /></ScrollPage>} />
          <Route path="/project/custom-graphs" element={<ScrollPage><CustomGraphsPage /></ScrollPage>} />
          <Route path="/project/report" element={<MotionWrap><ReportPage /></MotionWrap>} />
          <Route path="/about" element={<ScrollPage><AboutPage /></ScrollPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  )
}

function MotionWrap({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</div>
  return (
    <motion.div
      className="flex-1 flex flex-col min-w-0 overflow-hidden"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

function ScrollPage({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  if (reduce) {
    return (
      <div className="flex-1 overflow-auto scroll-thin">
        <div className="mx-auto max-w-screen-2xl p-6">{children}</div>
      </div>
    )
  }
  return (
    <motion.div
      className="flex-1 overflow-auto scroll-thin"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto max-w-screen-2xl p-6">{children}</div>
    </motion.div>
  )
}
