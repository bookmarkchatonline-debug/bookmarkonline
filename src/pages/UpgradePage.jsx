// src/pages/UpgradePage.jsx
import { useState } from 'react';
import { Check, Zap, Crown, Star, Lock, ArrowRight, Music, Video, BarChart2, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { joinUpgradeWaitlist } from '../firebase/firestore';
import toast from 'react-hot-toast';
import '../styles/pages.css';

const PLANS = [
  {
    id: 'free',
    name: 'Free Artist',
    price: '$0',
    period: 'forever',
    desc: 'Get started and show the world your sound',
    icon: Music,
    features: [
      { text: 'Up to 3 song uploads', included: true },
      { text: 'Basic artist profile', included: true },
      { text: 'Community rankings', included: true },
      { text: 'Gold Tape eligibility', included: true },
      { text: 'Live feed & discovery', included: true },
      { text: 'Video uploads', included: false },
      { text: 'Analytics dashboard', included: false },
      { text: 'Priority placement', included: false },
      { text: 'AI Vault access', included: false },
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    id: 'creator_pro',
    name: 'Creator Pro',
    price: '$9.99',
    period: '/month',
    desc: 'Unlock your full potential as a creator',
    icon: Zap,
    features: [
      { text: 'Unlimited song uploads', included: true },
      { text: 'Enhanced artist profile', included: true },
      { text: 'Community rankings', included: true },
      { text: 'Gold Tape eligibility', included: true },
      { text: 'Live feed & discovery', included: true },
      { text: 'Video uploads (coming soon)', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Priority placement', included: false },
      { text: 'AI Vault access (coming soon)', included: false },
    ],
    cta: 'Upgrade Plan',
    url: 'https://buy.stripe.com/8x228scoe2qpa8l0zjbZe00',
    popular: true,
  },
  {
    id: 'gold_creator',
    name: 'Gold Creator',
    price: '$24.99',
    period: '/month',
    desc: 'For serious artists ready to go all in',
    icon: Crown,
    features: [
      { text: 'Unlimited song uploads', included: true },
      { text: 'Premium gold profile', included: true },
      { text: 'Community rankings', included: true },
      { text: 'Gold Tape priority access', included: true },
      { text: 'Live feed & discovery', included: true },
      { text: 'Video uploads (coming soon)', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority placement', included: true },
      { text: 'AI Vault early access', included: true },
    ],
    cta: 'Upgrade Plan',
    url: 'https://buy.stripe.com/eVqfZibka3uteoB81LbZe01',
    popular: false,
  },
];

export default function UpgradePage() {
  const { user, profile } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentPlan = profile?.plan || 'free';

  const handleUpgradeRequest = async (planId) => {
    const plan = PLANS.find((p) => p.id === planId);
    if (!user) {
      toast.error('Please log in to upgrade your plan');
      return;
    }
    if (plan && plan.url) {
      setSubmitting(true);
      const checkoutUrl = `${plan.url}?client_reference_id=${user.uid}&prefilled_email=${encodeURIComponent(email || user.email || '')}`;
      window.location.href = checkoutUrl;
    } else if (plan) {
      setSubmitting(true);
      try {
        await joinUpgradeWaitlist(email || user?.email, user.uid, planId);
        toast.success(`You've been added to the waitlist for ${plan.name}!`);
        setSubmitted(true);
        setSelectedPlan(planId);
      } catch (err) {
        toast.error('Failed to join waitlist');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="page upgrade-page animate-fade-in">
      <div className="upgrade-hero">
        <div className="upgrade-hero-badge">
          <Crown size={16} />
          Creator Plans
        </div>
        <h1 className="upgrade-hero-title">
          Unlock Your Full<br />
          <span className="highlight">Creative Potential</span>
        </h1>
        <p className="upgrade-hero-sub">
          Choose a plan that fits your journey. Upgrade anytime to access premium creator tools.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="upgrade-plans-grid">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentPlan;
          const isRequested = submitted && selectedPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`upgrade-plan-card ${plan.popular ? 'upgrade-popular' : ''} ${isCurrent ? 'upgrade-current' : ''}`}
            >
              {plan.popular && (
                <div className="upgrade-popular-badge">Most Popular</div>
              )}

              <div className="upgrade-plan-icon">
                <Icon size={24} />
              </div>

              <h3 className="upgrade-plan-name">{plan.name}</h3>
              <div className="upgrade-plan-price">
                <span className="upgrade-price-amount">{plan.price}</span>
                <span className="upgrade-price-period">{plan.period}</span>
              </div>
              <p className="upgrade-plan-desc">{plan.desc}</p>

              <div className="upgrade-features-list">
                {plan.features.map((feature, i) => (
                  <div
                    key={i}
                    className={`upgrade-feature ${feature.included ? '' : 'upgrade-feature-locked'}`}
                  >
                    {feature.included ? (
                      <Check size={14} className="upgrade-feature-check" />
                    ) : (
                      <Lock size={12} className="upgrade-feature-lock" />
                    )}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="upgrade-plan-cta">
                {isCurrent ? (
                  <button className="btn btn-ghost btn-block" disabled>
                    <Check size={15} />
                    Current Plan
                  </button>
                ) : plan.id === 'free' ? (
                  <button className="btn btn-ghost btn-block" disabled>
                    Free Forever
                  </button>
                ) : isRequested ? (
                  <button className="btn btn-ghost btn-block" disabled>
                    <Check size={15} />
                    Redirecting...
                  </button>
                ) : (
                  <div className="upgrade-waitlist-form">
                    <input
                      type="email"
                      className="input"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                      className={`btn ${plan.popular ? 'btn-primary' : 'btn-ghost'} btn-block`}
                      onClick={() => handleUpgradeRequest(plan.id)}
                      disabled={submitting}
                    >
                      {submitting ? 'Requesting...' : plan.cta}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="upgrade-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="upgrade-faq-grid">
          <div className="upgrade-faq-item">
            <h4>How do I upgrade my plan?</h4>
            <p>Click "Upgrade Plan" to go to the secure Stripe checkout. Once you pay, your account will be automatically upgraded to the new plan.</p>
          </div>
          <div className="upgrade-faq-item">
            <h4>Will I lose my free features?</h4>
            <p>Never. Your free plan features are locked in forever. Upgrading only adds more on top.</p>
          </div>
          <div className="upgrade-faq-item">
            <h4>What is the AI Vault?</h4>
            <p>Coming soon — AI-powered tools for creators including beat matching, mood analysis, and smart recommendations.</p>
          </div>
          <div className="upgrade-faq-item">
            <h4>Can I switch plans?</h4>
            <p>Yes! You can upgrade, downgrade, or cancel anytime. No long-term commitments.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
