// src/components/common/CreatorBadge.jsx
import { Crown, Star, Zap, TrendingUp, Award } from 'lucide-react';

const LEVEL_CONFIG = {
  'Rising Artist': {
    icon: TrendingUp,
    className: 'level-rising-artist',
    emoji: '🌱',
  },
  'Trending': {
    icon: Zap,
    className: 'level-trending',
    emoji: '⚡',
  },
  'Gold Creator': {
    icon: Star,
    className: 'level-gold-creator',
    emoji: '⭐',
  },
  'Platinum': {
    icon: Crown,
    className: 'level-platinum',
    emoji: '💎',
  },
  'Gold Tape Winner': {
    icon: Award,
    className: 'level-gold-tape-winner',
    emoji: '🏆',
  },
};

export default function CreatorBadge({ level, size = 'sm', showIcon = true, showLabel = true }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG['Rising Artist'];
  const Icon = config.icon;
  const sizeClass = size === 'lg' ? 'creator-badge-lg' : size === 'md' ? 'creator-badge-md' : '';

  return (
    <span className={`level-badge ${config.className} ${sizeClass}`}>
      {showIcon && <Icon size={size === 'lg' ? 14 : size === 'md' ? 12 : 10} />}
      {showLabel && (level || 'Rising Artist')}
    </span>
  );
}

export { LEVEL_CONFIG };
