// src/pages/OpportunitiesPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpportunities } from '../firebase/firestore';
import { Calendar, Clock, ArrowRight, Zap, Award, Users, Mic, ExternalLink } from 'lucide-react';
import '../styles/pages.css';

const OPP_ICONS = {
  contest: Award,
  feature: Zap,
  collab: Users,
  placement: Mic,
  default: Calendar,
};

function daysUntil(deadline) {
  if (!deadline) return null;
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline.seconds ? new Date(deadline.seconds * 1000) : null;
  if (!d) return null;
  const diff = Math.ceil((d - Date.now()) / 86400000);
  return diff;
}

export default function OpportunitiesPage() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOpportunities(20).then((opps) => {
      setOpportunities(opps);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page opportunities-page animate-fade-in">
      <div className="opp-hero">
        <Calendar size={28} color="var(--accent)" />
        <h1>Opportunities</h1>
        <p>Contests, features, collaborations and placement opportunities for rising artists</p>
      </div>

      {loading ? (
        <div className="opp-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="opp-card skeleton-card" style={{ height: 200, opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗓️</div>
          <h3>No Active Opportunities Right Now</h3>
          <p>New opportunities are posted regularly. Check back soon!</p>
          <button className="btn btn-primary" onClick={() => navigate('/discover')}>
            Discover Music
          </button>
        </div>
      ) : (
        <div className="opp-grid">
          {opportunities.map((opp) => {
            const Icon = OPP_ICONS[opp.type] || OPP_ICONS.default;
            const days = daysUntil(opp.deadline);
            const isUrgent = days !== null && days <= 3;

            return (
              <div key={opp.id} className={`opp-card ${isUrgent ? 'opp-urgent' : ''}`}>
                <div className="opp-card-icon">
                  <Icon size={22} />
                </div>
                <div className="opp-card-type">
                  {opp.type ? opp.type.toUpperCase() : 'OPPORTUNITY'}
                </div>
                <h3 className="opp-card-title">{opp.title}</h3>
                {opp.description && (
                  <p className="opp-card-desc">{opp.description}</p>
                )}
                {opp.requirements && (
                  <div className="opp-card-requirements">
                    <span className="opp-req-label">Requirements:</span>
                    <span>{opp.requirements}</span>
                  </div>
                )}
                {opp.prize && (
                  <div className="opp-card-prize">
                    <Award size={14} />
                    <span>{opp.prize}</span>
                  </div>
                )}
                <div className="opp-card-footer">
                  <div className="opp-card-deadline">
                    <Clock size={13} />
                    {days !== null ? (
                      isUrgent ? (
                        <span className="opp-urgent-text">{days <= 0 ? 'Ends today!' : `${days} day${days !== 1 ? 's' : ''} left`}</span>
                      ) : (
                        <span>{days} day{days !== 1 ? 's' : ''} left</span>
                      )
                    ) : (
                      <span>{opp.deadlineLabel || 'Open'}</span>
                    )}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/upload')}
                  >
                    Submit <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
