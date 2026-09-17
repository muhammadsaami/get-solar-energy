export interface SettingsPreferences {
  discom: string
  tariff: string
  netMetering: string
}

export interface ReadonlyProfile {
  name: string
  role: string
}

export interface SettingsError {
  hasError: boolean
  message: string
}


