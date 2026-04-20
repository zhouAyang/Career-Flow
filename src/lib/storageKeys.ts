export const STORAGE_KEYS = {
  RESUMES: 'careerflow_resumes',
  APPLICATIONS: 'careerflow_applications',
  USER_SETTINGS: 'careerflow_settings',
  WORKSPACE: 'careerflow_workspace',
  SESSIONS: 'careerflow_sessions'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
