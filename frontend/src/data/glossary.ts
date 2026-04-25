export interface GlossaryEntry {
  label: string
  definition: string
  formula?: string
  ruleOfThumb?: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  vif: {
    label: 'Variance Inflation Factor (VIF)',
    definition:
      'How much a coefficient\u2019s variance is inflated by collinearity with other model terms.',
    formula: 'VIF\u2c7c = 1 / (1 \u2212 R\u00b2\u2c7c)',
    ruleOfThumb: 'VIF \u2264 5 is fine; VIF > 10 indicates multicollinearity to fix.',
  },
  adeq_precision: {
    label: 'Adequate Precision',
    definition:
      'Signal-to-noise ratio comparing the spread of predicted values to the average prediction error.',
    formula: '(max(\u0177) \u2212 min(\u0177)) / \u221amean(SE\u00b2_pred)',
    ruleOfThumb: 'Greater than 4 is desirable; the model can navigate the design space.',
  },
  cooks: {
    label: 'Cook\u2019s Distance',
    definition: 'Measures how much each run influences the fitted model.',
    formula: 'D\u1d62 = (e\u00b2\u1d62 / p\u00b7s\u00b2) \u00b7 h\u1d62\u1d62 / (1 \u2212 h\u1d62\u1d62)\u00b2',
    ruleOfThumb: 'D\u1d62 > 4/n flags an influential point worth investigating.',
  },
  dffits: {
    label: 'DFFITS',
    definition:
      'Standardized change in the fitted value of run i when run i is deleted from the fit.',
    ruleOfThumb: '|DFFITS| > 2\u00b7\u221a(p/n) suggests an influential observation.',
  },
  leverage: {
    label: 'Leverage',
    definition:
      'A run\u2019s unique influence on the fit, regardless of its response value. High leverage means the run sits at an extreme corner of the design space.',
    formula: 'h\u1d62\u1d62 = diag(X(X\u02b2X)\u207b\u00b9X\u02b2)',
    ruleOfThumb: 'Average leverage = p/n. Values > 2\u00b7p/n deserve attention.',
  },
  box_cox: {
    label: 'Box\u2013Cox \u03bb',
    definition:
      'Power transformation that stabilizes variance. \u03bb = 0 corresponds to the natural log; \u03bb = 1 means no transform.',
    formula: 'y(\u03bb) = (y^\u03bb \u2212 1) / \u03bb',
    ruleOfThumb: 'If the 95% CI for \u03bb covers 1, no transform is needed.',
  },
  r_squared: {
    label: 'R\u00b2',
    definition: 'Fraction of variation in the response explained by the model.',
    formula: 'R\u00b2 = 1 \u2212 SSE/SST',
    ruleOfThumb: 'Always inflated by adding terms; use Adj R\u00b2 to compare models.',
  },
  adj_r_squared: {
    label: 'Adjusted R\u00b2',
    definition: 'R\u00b2 penalized for model complexity \u2014 only rises when added terms truly improve fit.',
  },
  pred_r_squared: {
    label: 'Predicted R\u00b2',
    definition: 'Cross-validated R\u00b2 estimating predictive power on new data, computed via PRESS.',
    formula: '1 \u2212 PRESS/SST',
    ruleOfThumb: 'Should be within ~0.20 of Adj R\u00b2; large gap suggests overfitting.',
  },
  cv: {
    label: 'CV %',
    definition:
      'Standard deviation of residuals expressed as a percentage of the mean response \u2014 a relative noise indicator.',
    ruleOfThumb: 'Lower is better; >10% may signal noisy data.',
  },
  press: {
    label: 'PRESS',
    definition: 'Predicted Residual Sum of Squares. Lower means better leave-one-out predictive accuracy.',
    formula: '\u03a3 (e\u1d62 / (1 \u2212 h\u1d62\u1d62))\u00b2',
  },
  p_value: {
    label: 'p-value',
    definition: 'Probability of observing an effect this large by chance if the term were truly null.',
    ruleOfThumb: 'p < 0.05 \u2192 significant; p < 0.10 \u2192 marginal.',
  },
  f_value: {
    label: 'F-value',
    definition: 'Ratio of explained-to-unexplained variance for a term or for the whole model.',
    ruleOfThumb: 'Larger F means stronger evidence the term matters.',
  },
  lof: {
    label: 'Lack of Fit',
    definition:
      'Compares the residual error against pure error from replicates. Significant LoF means your model is missing important terms.',
    ruleOfThumb: 'p > 0.10 = good (no significant lack of fit).',
  },
  shapiro: {
    label: 'Shapiro\u2013Wilk Test',
    definition: 'Tests whether the residuals are normally distributed.',
    ruleOfThumb: 'p > 0.05 \u2192 normality is reasonable.',
  },
  desirability: {
    label: 'Desirability',
    definition:
      'Derringer\u2013Suich one- or two-sided function that scores each predicted response in [0,1] given a goal (min/max/target/range).',
    formula: 'D = (d\u2081\u02b3\u00b9 \u00b7 d\u2082\u02b3\u00b2 \u22ef d\u2099\u02b3\u207f)^(1/\u03a3r)',
    ruleOfThumb: 'D = 1 means every goal is perfectly satisfied; D \u2265 0.7 is excellent.',
  },
}
