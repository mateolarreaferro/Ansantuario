import type { ReactionType } from '../../types/note'

interface ReactionIconProps {
  type: ReactionType
  size?: number
  filled?: boolean
  color?: string
}

export default function ReactionIcon({ type, size = 16, filled = false, color = 'currentColor' }: ReactionIconProps) {
  const stroke = filled ? 'none' : color
  const fill = filled ? color : 'none'
  const sw = 1.8

  switch (type) {
    case 'heart':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )
    case 'smile':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={filled ? fill : stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" fill={filled ? color : 'none'} stroke={filled ? color : stroke} opacity={filled ? 0.2 : 1} />
          <circle cx="12" cy="12" r="10" fill="none" stroke={filled ? color : stroke} strokeWidth={sw} />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={filled ? color : stroke} />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={2.5} stroke={filled ? color : stroke} />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={2.5} stroke={filled ? color : stroke} />
        </svg>
      )
    case 'flame':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={filled ? 'none' : stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={filled ? 'none' : stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
        </svg>
      )
    case 'abrazo':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={filled ? color : stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11c0-3.3-2.7-6-6-6s-6 2.7-6 6" stroke={filled ? color : stroke} />
          <path d="M6 11c-1.7 0-3 1.3-3 3s1.3 3 3 3" fill={filled ? color : 'none'} opacity={filled ? 0.2 : 1} />
          <path d="M18 11c1.7 0 3 1.3 3 3s-1.3 3-3 3" fill={filled ? color : 'none'} opacity={filled ? 0.2 : 1} />
          <path d="M6 17c0 2.2 2.7 4 6 4s6-1.8 6-4" stroke={filled ? color : stroke} />
          <circle cx="9.5" cy="11.5" r="1" fill={filled ? color : stroke} stroke="none" />
          <circle cx="14.5" cy="11.5" r="1" fill={filled ? color : stroke} stroke="none" />
        </svg>
      )
    case 'teardrop':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={filled ? 'none' : stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      )
  }
}
