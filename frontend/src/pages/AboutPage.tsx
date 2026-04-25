import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AboutPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="About DOE Lab"
        description="A free, open-source alternative to commercial Design of Experiments software."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What's inside</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            DOE Lab is built on a Python statistical engine (FastAPI + scipy + statsmodels +
            pyDOE3) with a React + TypeScript front end. All your project data is stored locally
            in your browser via IndexedDB — nothing leaves your machine.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Full and fractional 2ᵏ factorial designs, Plackett–Burman, CCD, Box–Behnken</li>
            <li>ANOVA with lack-of-fit, model selection, Box–Cox transformations</li>
            <li>Diagnostics: residuals, leverage, Cook's distance, Shapiro–Wilk</li>
            <li>Contour, 3D surface, perturbation, interaction, Pareto plots</li>
            <li>Multi-response numerical optimization via Derringer–Suich desirability</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
