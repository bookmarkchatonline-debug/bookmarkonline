// src/pages/AwardsPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Crown, Zap, Flame, Lightbulb, Star, Award, ChevronRight } from 'lucide-react';
import { getGoldTapeAwards, getWeeklyWinners } from '../firebase/firestore';
import CountdownTimer from '../components/common/CountdownTimer';
import CreatorBadge from '../components/common/CreatorBadge';
import '../styles/pages.css';

const AWARD_CATEGORIES = [
  { key: 'bestSong', name: 'Best Song', icon: Trophy, emoji: '🏆', desc: 'Most liked track of the month' },
  { key: 'producerOfMonth', name: 'Producer of the Month', icon: Star, emoji: '🎛', desc: 'Highest total engagement' },
  { key: 'breakoutArtist', name: 'Breakout Artist', icon: Zap, emoji: '🚀', desc: 'Biggest growth, new artists' },
  { key: 'mostConsistent', name: 'Most Consistent', icon: Flame, emoji: '🔥', desc: 'Active every week of the month' },
  { key: 'bestCreative', name: 'Best Creative Idea', icon: Lightbulb, emoji: '💡', desc: 'Most unique artistic approach' },
];

function WinnerCard({ category, winner, index }) {
  const navigate = useNavigate();
  const Icon = category.icon;

  return (
    <div
      className={`award-winner-card ${index === 0 ? 'award-winner-featured' : ''}`}
      onClick={() => winner?.uid && navigate(`/profile/${winner.uid}`)}
      role="button"
      tabIndex={0}
    >
      <div className="award-winner-icon">
        <Icon size={20} />
      </div>
      <div className="award-winner-emoji">{category.emoji}</div>
      <div className="award-winner-category">{category.name}</div>
      <div className="award-winner-desc">{category.desc}</div>
      {winner ? (
        <div className="award-winner-info">
          <div className="award-winner-avatar">
            {winner.avatarUrl ? (
              <img src={winner.avatarUrl} alt={winner.username} />
            ) : (
              <div className="award-winner-avatar-fallback">
                {(winner.username || 'A').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="award-winner-name">{winner.username || winner.winnerName || 'TBD'}</div>
          {winner.trackTitle && (
            <div className="award-winner-track">"{winner.trackTitle}"</div>
          )}
        </div>
      ) : (
        <div className="award-winner-pending">
          <span>Awaiting Selection</span>
        </div>
      )}
    </div>
  );
}

export default function AwardsPage() {
  const navigate = useNavigate();
  const [awards, setAwards] = useState([]);
  const [weeklyWinners, setWeeklyWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getGoldTapeAwards(12),
      getWeeklyWinners(8),
    ]).then(([a, w]) => {
      setAwards(a);
      setWeeklyWinners(w);
      setLoading(false);
    });
  }, []);

  const latestAward = awards[0] || null;
  const pastAwards = awards.slice(1);

  // Map latest award categories to display
  const displayCategories = AWARD_CATEGORIES.map((cat) => {
    const match = latestAward?.categories?.find((c) => c.key === cat.key || c.name === cat.name);
    return { ...cat, winner: match || null };
  });

  return (
    <div className="page awards-page animate-fade-in">
      {/* Hero */}
      <div className="awards-hero">
        <div className="awards-hero-glow" />
        <div className="awards-hero-content">
          <div className="awards-hero-badge">
            <Trophy size={18} />
            Gold Tape Awards
          </div>
          <h1 className="awards-hero-title">
            Monthly Recognition for<br />
            <span className="highlight">Rising Artists</span>
          </h1>
          <p className="awards-hero-sub">
            Every month, we spotlight the best creators in the community. Win a Gold Tape and level up your career.
          </p>
          <CountdownTimer label="Next Awards In" />
        </div>
      </div>

      {/* Current Month Winners */}
      <section className="awards-section">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Crown size={18} color="var(--accent)" />
            <span className="section-title">
              {latestAward?.title || 'This Month\'s Winners'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="awards-grid-main">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="award-winner-card skeleton-card" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : displayCategories.some((c) => c.winner) ? (
          <div className="awards-grid-main">
            {displayCategories.map((cat, i) => (
              <WinnerCard key={cat.key} category={cat} winner={cat.winner} index={i} />
            ))}
          </div>
        ) : (
          <div className="awards-empty">
            <Trophy size={48} className="awards-empty-icon" />
            <h3>Awards Coming Soon</h3>
            <p>Winners will be announced at the end of the month. Keep creating!</p>
            <div className="awards-how-to-win">
              <h4>How to Win a Gold Tape</h4>
              <div className="awards-criteria-grid">
                {AWARD_CATEGORIES.map((cat) => (
                  <div key={cat.key} className="awards-criteria-card">
                    <span className="awards-criteria-emoji">{cat.emoji}</span>
                    <span className="awards-criteria-name">{cat.name}</span>
                    <span className="awards-criteria-desc">{cat.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Weekly Winners */}
      {weeklyWinners.length > 0 && (
        <section className="awards-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Flame size={16} color="var(--accent)" />
              <span className="section-title">Weekly Highlights</span>
            </div>
          </div>
          <div className="weekly-winners-list">
            {weeklyWinners.map((week) => (
              <div key={week.id} className="weekly-winner-card">
                <div className="weekly-winner-header">
                  <Award size={14} />
                  <span>Week of {week.weekStart?.seconds
                    ? new Date(week.weekStart.seconds * 1000).toLocaleDateString()
                    : 'Recent'}</span>
                </div>
                {week.winners?.map((w, i) => (
                  <div key={i} className="weekly-winner-row" onClick={() => navigate(`/track/${w.id}`)}>
                    <span className="weekly-winner-rank">{i + 1}</span>
                    <span className="weekly-winner-title">{w.title}</span>
                    <span className="weekly-winner-artist">{w.username}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past Awards Archive */}
      {pastAwards.length > 0 && (
        <section className="awards-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Star size={16} color="var(--accent)" />
              <span className="section-title">Past Awards</span>
            </div>
          </div>
          <div className="past-awards-grid">
            {pastAwards.map((award) => (
              <div key={award.id} className="past-award-card">
                <div className="past-award-title">{award.title || 'Gold Tape Award'}</div>
                <div className="past-award-count">
                  {award.categories?.length || award.awards?.length || 0} winners
                </div>
                {award.categories?.slice(0, 3).map((cat, i) => (
                  <div key={i} className="past-award-winner">
                    <span className="past-award-cat">{cat.name}</span>
                    <span className="past-award-name">{cat.winnerName || 'TBD'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
