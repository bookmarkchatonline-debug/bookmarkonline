// src/components/common/CountdownTimer.jsx
import { useState, useEffect } from 'react';

function getEndOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}

function formatCountdown(ms) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms / 1000 / 3600) % 24);
  const days = Math.floor(ms / 1000 / 3600 / 24);
  return { days, hours, minutes, seconds };
}

export default function CountdownTimer({ targetDate, label = 'Next Awards' }) {
  const target = targetDate ? new Date(targetDate) : getEndOfMonth();
  const [timeLeft, setTimeLeft] = useState(formatCountdown(target - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = target - Date.now();
      setTimeLeft(formatCountdown(diff));
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [target.getTime()]);

  return (
    <div className="countdown-timer">
      <div className="countdown-label">{label}</div>
      <div className="countdown-blocks">
        <div className="countdown-block">
          <span className="countdown-value">{timeLeft.days}</span>
          <span className="countdown-unit">days</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-block">
          <span className="countdown-value">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="countdown-unit">hrs</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-block">
          <span className="countdown-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="countdown-unit">min</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-block">
          <span className="countdown-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="countdown-unit">sec</span>
        </div>
      </div>
    </div>
  );
}
