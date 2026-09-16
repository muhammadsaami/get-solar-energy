export const SOLAR_YIELD = 125
export const NET_METERING_RATE = 7
export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const VALID_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
export const VALID_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf']

export const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_MULTIPLIERS = [0.95, 0.9, 0.93, 1.05, 1.1, 1.3, 1.25, 1.2, 1.1, 1.0, 0.9, 0.96]

export const COST_BREAKDOWN_CHART_COLORS = {
  backgroundColor: [
    'rgba(23, 168, 229, 0.75)',
    'rgba(255, 138, 29, 0.75)',
    'rgba(54, 211, 153, 0.75)',
    'rgba(159, 179, 200, 0.75)',
  ],
  borderColor: ['#17a8e5', '#ff8a1d', '#36d399', '#9fb3c8'],
}

export const HISTORY_CHART_STYLES = {
  billBackground: 'rgba(23, 168, 229, 0.4)',
  billBorder: '#17a8e5',
  savingsBackground: 'rgba(54, 211, 153, 0.4)',
  savingsBorder: '#36d399',
}

export const CHART_TOOLTIP_THEME = {
  backgroundColor: '#0d2134',
  titleColor: '#f7fbff',
  bodyColor: '#9fb3c8',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
}
