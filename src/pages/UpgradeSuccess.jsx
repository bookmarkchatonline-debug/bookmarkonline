// src/pages/UpgradeSuccess.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../firebase/firestore';
import { CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/pages.css';

export default function UpgradeSuccess() {
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(true);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (!user) {
      // User might be loading or logged out
      return;
    }

    if (!plan) {
      setUpgrading(false);
      return;
    }

    const upgradeUser = async () => {
      try {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await updateUserProfile(user.uid, {
          plan: plan,
          planActivatedAt: new Date(),
          planExpiresAt: expiresAt,
        });
        await refreshProfile();
        toast.success(`Successfully upgraded to ${plan.replace('_', ' ')}!`);
      } catch (error) {
        console.error("Error upgrading plan:", error);
        toast.error("Failed to upgrade plan. Please contact support.");
      } finally {
        setUpgrading(false);
        // Clean URL to prevent re-triggering on refresh
        navigate('/upgrade/success', { replace: true });
      }
    };

    upgradeUser();
  }, [user, searchParams, navigate, refreshProfile]);

  return (
    <div className="page upgrade-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      {upgrading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }}></div>
          <h2>Activating your new plan...</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CheckCircle size={64} color="var(--accent)" style={{ marginBottom: 20 }} />
          <h1>Payment Successful!</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 10, maxWidth: 400 }}>
            Your account has been successfully upgraded. Thank you for your support!
          </p>
          <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/profile/' + user?.uid)}>
            Go to Profile
          </button>
        </div>
      )}
    </div>
  );
}
