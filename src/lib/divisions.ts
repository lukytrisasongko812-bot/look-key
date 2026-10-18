export interface DivisionGroup {
  groupLabel: string
  options: {
    value: string
    label: string
  }[]
}

/**
 * Struktur Organisasi Resmi (BSO) sesuai Bagan Struktur Organisasi Perusahaan
 */
export const CORPORATE_DIVISION_GROUPS: DivisionGroup[] = [
  {
    groupLabel: 'Board of Directors (Direksi)',
    options: [
      { value: 'President Director', label: 'President Director' },
      { value: 'Operation and Planning Director', label: 'Operation and Planning Director' },
      { value: 'Finance & Administration Director', label: 'Finance & Administration Director' },
    ],
  },
  {
    groupLabel: 'Direct Report to President Director',
    options: [
      { value: 'Corsec, Legal & Compliance', label: 'Corsec, Legal & Compliance' },
      { value: 'SCM', label: 'SCM (Supply Chain Management)' },
      { value: 'Corporate & Commercial Strategic', label: 'Corporate & Commercial Strategic' },
      { value: 'HSE Senior Specialist', label: 'HSE Senior Specialist' },
      { value: 'SME', label: 'SME (Subject Matter Expert)' },
      { value: 'IA', label: 'IA (Internal Audit)' },
    ],
  },
  {
    groupLabel: 'Operation and Planning Directorate',
    options: [
      { value: 'Exploration', label: 'Exploration' },
      { value: 'Laboratory', label: 'Laboratory' },
      { value: 'Mining', label: 'Mining' },
      { value: 'PMO', label: 'PMO (Project Management Office)' },
    ],
  },
  {
    groupLabel: 'Finance & Administration Directorate',
    options: [
      { value: 'Corporate Finance & Risk Management', label: 'Corporate Finance & Risk Management' },
      { value: 'Finance & Accounting', label: 'Finance & Accounting' },
      { value: 'HC, GA and IT', label: 'HC, GA and IT' },
    ],
  },
  {
    groupLabel: 'Project Matrix',
    options: [
      { value: 'Project Matrix - Tipe A (Project Coordinator)', label: 'Project Matrix - Tipe A (Project Coordinator)' },
      { value: 'Project Matrix - Tipe B (Project Manager)', label: 'Project Matrix - Tipe B (Project Manager)' },
      { value: 'Project Matrix - Tipe C (General Manager)', label: 'Project Matrix - Tipe C (General Manager)' },
    ],
  },
]

export const ALL_CORPORATE_DIVISIONS: string[] = CORPORATE_DIVISION_GROUPS.flatMap((g) =>
  g.options.map((o) => o.value)
)
