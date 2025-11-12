// Pathology reference ranges based on Ampath document
// This file should be populated with actual reference ranges from the PDF

export interface PathologyReferenceRange {
  testName: string
  category: 'IMMUNOLOGY' | 'ENDOCRINOLOGY' | 'BIOCHEMISTRY' | 'HAEMATOLOGY'
  unit: string
  male?: {
    min?: number
    max?: number
  }
  female?: {
    min?: number
    max?: number
  }
  general?: {
    min?: number
    max?: number
  }
  ageDependent?: boolean
  notes?: string
}

// Pathology reference ranges - to be populated from Ampath document
export const PATHOLOGY_REFERENCE_RANGES: PathologyReferenceRange[] = [
  // Immunology
  {
    testName: 'TOTAL_IGE',
    category: 'IMMUNOLOGY',
    unit: 'kU/L',
    general: { min: 0, max: 100 }, // Placeholder - update from PDF
  },

  // Endocrinology
  {
    testName: 'TSH',
    category: 'ENDOCRINOLOGY',
    unit: 'mIU/L',
    general: { min: 0.4, max: 4.0 }, // Placeholder - update from PDF
  },
  {
    testName: 'FREE_T4',
    category: 'ENDOCRINOLOGY',
    unit: 'pmol/L',
    general: { min: 12, max: 22 }, // Placeholder - update from PDF
  },
  {
    testName: 'FREE_T3',
    category: 'ENDOCRINOLOGY',
    unit: 'pmol/L',
    general: { min: 3.1, max: 6.8 }, // Placeholder - update from PDF
  },

  // Biochemistry
  {
    testName: 'UREA',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 2.5, max: 7.5 }, // Placeholder - update from PDF
  },
  {
    testName: 'CREATININE',
    category: 'BIOCHEMISTRY',
    unit: 'μmol/L',
    male: { min: 62, max: 106 },
    female: { min: 44, max: 80 },
  },
  {
    testName: 'URATE',
    category: 'BIOCHEMISTRY',
    unit: 'μmol/L',
    male: { min: 200, max: 420 },
    female: { min: 140, max: 340 },
  },
  {
    testName: 'SODIUM',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 136, max: 145 }, // Placeholder - update from PDF
  },
  {
    testName: 'POTASSIUM',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 3.5, max: 5.1 }, // Placeholder - update from PDF
  },
  {
    testName: 'CALCIUM',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 2.15, max: 2.55 }, // Placeholder - update from PDF
  },
  {
    testName: 'MAGNESIUM',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 0.70, max: 1.00 }, // Placeholder - update from PDF
  },
  {
    testName: 'PHOSPHATE',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 0.87, max: 1.45 }, // Placeholder - update from PDF
  },
  {
    testName: 'VITAMIN_D3',
    category: 'BIOCHEMISTRY',
    unit: 'nmol/L',
    general: { min: 75, max: 250 }, // Placeholder - update from PDF
  },
  {
    testName: 'HBA1C',
    category: 'BIOCHEMISTRY',
    unit: '%',
    general: { min: 4.0, max: 6.0 }, // Placeholder - update from PDF
  },
  {
    testName: 'TOTAL_CHOLESTEROL',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 0, max: 5.2 }, // Placeholder - update from PDF
  },
  {
    testName: 'TRIGLYCERIDES',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 0, max: 1.7 }, // Placeholder - update from PDF
  },
  {
    testName: 'HDL_CHOLESTEROL',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    male: { min: 0.9, max: 2.0 },
    female: { min: 1.0, max: 2.2 },
  },
  {
    testName: 'LDL_CHOLESTEROL',
    category: 'BIOCHEMISTRY',
    unit: 'mmol/L',
    general: { min: 0, max: 3.4 }, // Placeholder - update from PDF
  },
  {
    testName: 'CK',
    category: 'BIOCHEMISTRY',
    unit: 'U/L',
    male: { min: 39, max: 308 },
    female: { min: 26, max: 192 },
  },
  {
    testName: 'HOMOCYSTEINE',
    category: 'BIOCHEMISTRY',
    unit: 'μmol/L',
    male: { min: 5, max: 15 },
    female: { min: 5, max: 12 },
  },

  // Haematology
  {
    testName: 'FBC',
    category: 'HAEMATOLOGY',
    unit: 'Various',
    notes: 'Full Blood Count - multiple parameters', // Placeholder
  },
  {
    testName: 'PLATELETS',
    category: 'HAEMATOLOGY',
    unit: '×10⁹/L',
    general: { min: 150, max: 450 }, // Placeholder - update from PDF
  },
  {
    testName: 'ESR',
    category: 'HAEMATOLOGY',
    unit: 'mm/h',
    male: { min: 0, max: 15 },
    female: { min: 0, max: 20 },
  },
]

/**
 * Get reference range for a pathology test
 */
export function getReferenceRange(
  testName: string,
  sex?: string,
  age?: number
): PathologyReferenceRange | null {
  const range = PATHOLOGY_REFERENCE_RANGES.find(
    r => r.testName === testName.toUpperCase()
  )
  return range || null
}

/**
 * Evaluate pathology result against reference range
 * Returns: 'LOW' | 'HIGH' | 'IN_RANGE' | 'UNKNOWN'
 */
export function evaluatePathologyResult(
  testName: string,
  value: number,
  sex?: string,
  age?: number
): {
  status: 'LOW' | 'HIGH' | 'IN_RANGE' | 'UNKNOWN'
  range?: PathologyReferenceRange
  message?: string
} {
  const range = getReferenceRange(testName, sex, age)
  
  if (!range) {
    return { status: 'UNKNOWN', message: 'Reference range not found for this test' }
  }

  // Determine which range to use (male, female, or general)
  let min: number | undefined
  let max: number | undefined

  if (sex === 'M' && range.male) {
    min = range.male.min
    max = range.male.max
  } else if (sex === 'F' && range.female) {
    min = range.female.min
    max = range.female.max
  } else if (range.general) {
    min = range.general.min
    max = range.general.max
  }

  if (min === undefined || max === undefined) {
    return { status: 'UNKNOWN', range, message: 'Reference range incomplete' }
  }

  if (value < min) {
    return {
      status: 'LOW',
      range,
      message: `Value ${value} ${range.unit} is below normal range (${min}-${max} ${range.unit})`,
    }
  }

  if (value > max) {
    return {
      status: 'HIGH',
      range,
      message: `Value ${value} ${range.unit} is above normal range (${min}-${max} ${range.unit})`,
    }
  }

  return {
    status: 'IN_RANGE',
    range,
    message: `Value ${value} ${range.unit} is within normal range (${min}-${max} ${range.unit})`,
  }
}

/**
 * Validate pathology workflow result
 */
export function validatePathologyResult(
  workflowSubType: string,
  resultData: any,
  sampleSex?: string,
  sampleAge?: number
): { passed: boolean; evaluations: any[]; reason?: string } {
  const evaluations: any[] = []

  // Map workflow subtypes to test names
  const testNameMap: Record<string, string> = {
    'IMMUNOLOGY_TOTAL_IGE': 'TOTAL_IGE',
    'ENDOCRINOLOGY_TSH': 'TSH',
    'ENDOCRINOLOGY_FREE_T4': 'FREE_T4',
    'ENDOCRINOLOGY_FREE_T3': 'FREE_T3',
    'BIOCHEMISTRY_UREA': 'UREA',
    'BIOCHEMISTRY_CREATININE': 'CREATININE',
    'BIOCHEMISTRY_URATE': 'URATE',
    'BIOCHEMISTRY_SODIUM': 'SODIUM',
    'BIOCHEMISTRY_POTASSIUM': 'POTASSIUM',
    'BIOCHEMISTRY_CALCIUM': 'CALCIUM',
    'BIOCHEMISTRY_MAGNESIUM': 'MAGNESIUM',
    'BIOCHEMISTRY_PHOSPHATE': 'PHOSPHATE',
    'BIOCHEMISTRY_VITAMIN_D3': 'VITAMIN_D3',
    'BIOCHEMISTRY_HBA1C': 'HBA1C',
    'BIOCHEMISTRY_TOTAL_CHOLESTEROL': 'TOTAL_CHOLESTEROL',
    'BIOCHEMISTRY_TRIGLYCERIDES': 'TRIGLYCERIDES',
    'BIOCHEMISTRY_HDL_CHOLESTEROL': 'HDL_CHOLESTEROL',
    'BIOCHEMISTRY_LDL_CHOLESTEROL': 'LDL_CHOLESTEROL',
    'BIOCHEMISTRY_CK': 'CK',
    'BIOCHEMISTRY_HOMOCYSTEINE': 'HOMOCYSTEINE',
    'HAEMATOLOGY_FBC': 'FBC',
    'HAEMATOLOGY_PLATELETS': 'PLATELETS',
    'HAEMATOLOGY_ESR': 'ESR',
  }

  const testName = testNameMap[workflowSubType]
  if (!testName) {
    return {
      passed: false,
      evaluations: [],
      reason: `Unknown pathology test: ${workflowSubType}`,
    }
  }

  // Handle FBC (Full Blood Count) - multiple parameters
  if (testName === 'FBC' && resultData.parameters) {
    let allInRange = true
    for (const param of resultData.parameters) {
      const evaluation = evaluatePathologyResult(
        param.testName || param.name,
        param.value,
        sampleSex,
        sampleAge
      )
      evaluations.push({
        parameter: param.testName || param.name,
        value: param.value,
        ...evaluation,
      })
      if (evaluation.status !== 'IN_RANGE' && evaluation.status !== 'UNKNOWN') {
        allInRange = false
      }
    }
    return {
      passed: allInRange,
      evaluations,
      reason: allInRange
        ? 'All FBC parameters within normal range'
        : 'Some FBC parameters outside normal range',
    }
  }

  // Single parameter test
  const value = resultData.value || resultData.result
  if (value === undefined || value === null) {
    return {
      passed: false,
      evaluations: [],
      reason: 'No value provided for pathology test',
    }
  }

  const evaluation = evaluatePathologyResult(testName, value, sampleSex, sampleAge)
  evaluations.push({
    testName,
    value,
    ...evaluation,
  })

  // For pathology, "passed" means value is within range (not necessarily good/bad clinically)
  // The status (LOW/HIGH/IN_RANGE) is what matters
  return {
    passed: evaluation.status === 'IN_RANGE' || evaluation.status === 'UNKNOWN',
    evaluations,
    reason: evaluation.message,
  }
}

