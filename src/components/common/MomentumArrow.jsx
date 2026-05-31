// src/components/common/MomentumArrow.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MomentumArrow({ delta, showValue = true, size = 14 }) {
  if (delta === undefined || delta === null) return null;

  const num = Number(delta);
  if (num > 0) {
    return (
      <span className="momentum-arrow momentum-up">
        <TrendingUp size={size} />
        {showValue && <span>+{num}</span>}
      </span>
    );
  }
  if (num < 0) {
    return (
      <span className="momentum-arrow momentum-down">
        <TrendingDown size={size} />
        {showValue && <span>{num}</span>}
      </span>
    );
  }
  return (
    <span className="momentum-arrow momentum-steady">
      <Minus size={size} />
      {showValue && <span>—</span>}
    </span>
  );
}
