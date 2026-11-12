export const colors = {
  background: '#FFF9EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EEDF',
  text: '#242B23',
  textSecondary: '#52604F',
  textOnPrimary: '#FFFFFF',
  primary: '#426B3A',
  primaryDark: '#2F4F29',
  primarySoft: '#DCEBD3',
  border: '#DDE3D7',
  // Cow
  cowWhite: '#FFFFFF',
  cowSpot: '#2B2B2B',
  cowPink: '#F7B6C2',
  cowOutline: '#242B23',
  cowGhost: '#E9E6DC',
  // Progress / data
  fill: '#6FB85C',
  fillDeep: '#4C9A3D',
  good: '#3E9B4F',
  bad: '#D9534F',
  warning: '#E8A33D',
  calories: '#F08A4B',
  carbs: '#E3B341',
  fat: '#5B8DEF',
  creatine: '#8E6FD8',
  ufo: '#8E9AAF',
  beam: '#C9F27B',
  overlay: 'rgba(36,43,35,0.45)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const typography = {
  sizes: { caption: 14, body: 18, heading: 28, title: 48, mascot: 72, small: 12, label: 16, display: 64 },
  weights: { regular: '400', medium: '500', bold: '700' },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
