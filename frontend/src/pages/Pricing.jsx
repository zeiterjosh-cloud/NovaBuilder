import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Zap, Check, ArrowRight, Star, Rocket, Shield, AlertTriangle, X } from 'lucide-react';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'from-gray-500 to-gray-600',
    features: [
      '10 AI code generations',
      'Monaco code editor',
      'Live iframe preview',
      'Project saving',
      'Beginner mode (DevBuddy)',
    ],
    limitations: [
      'No Unity export',
      'No deployment',
      'Limited generations',
    ],
    cta: 'Get Started Free',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    color: 'from-purple-500 to-blue-500',
    popular: true,
    features: [
      'Unlimited AI generations',
      'Unity export (.cs + ZIP)',
      'One-click deployment',
      'DevBuddy AI chat',
      'All templates',
      'Public project sharing',
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
  },
  {
    key: 'studio',
    name: 'Studio',
    price: '$79',
    period: 'per month',
    color: 'from-pink-500 to-purple-500',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Advanced AI models',
      'Custom deployment domains',
      'Priority support',
      'Analytics dashboard',
    ],
    limitations: [],
    cta: 'Upgrade to Studio',
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const handleUpgrade = async (plan) => {
    if (!user) { navigate('/auth'); return; }
    if (plan === 'free') { navigate('/builder'); return; }

    setLoading(plan);
    setError('');
    try {
      const res = await client.post('/stripe/create-checkout', { plan });
      if (res.data.url) {
        window.location.href = res.data.url;
      } else if (res.data.mock) {
        setError('Stripe is not configured. Add STRIPE_SECRET_KEY to your backend .env file to enable payments.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-bg">
      {/* Nav */}
      <nav className="glass border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">NovaBuilder</span>
        </button>
        <div className="flex-1" />
        {user ? (
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
            Dashboard
          </button>
        ) : (
          <button onClick={() => navigate('/auth')} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white">
            Sign In
          </button>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black gradient-text mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-400 text-xl">Start free. Upgrade when you're ready to build more.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-8 max-w-2xl mx-auto">
            <AlertTriangle size={14} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')}><X size={14} /></button>
          </div>
        )}

        {user && (
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300">
              <Star size={14} className="text-purple-400" />
              Current plan: <strong className="text-white">{user.plan?.charAt(0).toUpperCase() + user.plan?.slice(1) || 'Free'}</strong>
            </span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className={`glass rounded-2xl p-8 relative transition-all hover:border-purple-500/40 ${plan.popular ? 'border-purple-500/40 ring-1 ring-purple-500/40' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                {plan.key === 'free' ? <Zap className="w-6 h-6 text-white" /> :
                 plan.key === 'pro' ? <Rocket className="w-6 h-6 text-white" /> :
                 <Shield className="w-6 h-6 text-white" />}
              </div>

              <h2 className="text-2xl font-black mb-1">{plan.name}</h2>
              <div className="mb-6">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-gray-400 text-sm ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.limitations.map(l => (
                  <li key={l} className="flex items-start gap-2 text-sm text-gray-500">
                    <X size={16} className="text-gray-600 mt-0.5 flex-shrink-0" />
                    {l}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={loading === plan.key || (user?.plan === plan.key)}
                className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                  user?.plan === plan.key
                    ? 'bg-white/5 text-gray-400 cursor-default'
                    : plan.popular
                    ? 'btn-primary'
                    : 'bg-white/10 hover:bg-white/20'
                } disabled:opacity-60`}
              >
                {loading === plan.key ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : user?.plan === plan.key ? (
                  <><Check size={16} /> Current Plan</>
                ) : (
                  <>{plan.cta} <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-black text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { q: 'What counts as a generation?', a: 'Each time you click Generate and AI creates code for you, that counts as one generation.' },
              { q: 'Can I export Unity projects?', a: 'Yes! Pro and Studio plans allow you to export Unity C# scripts as .cs files or as a complete ZIP package.' },
              { q: 'How does deployment work?', a: 'Pro users can deploy HTML/JS projects with one click. Projects get a public URL served from our servers.' },
              { q: 'Is there a free trial for Pro?', a: 'The Free plan lets you try the core features with 10 generations. Upgrade anytime for unlimited access.' },
            ].map(({ q, a }) => (
              <div key={q} className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-2 text-white">{q}</h3>
                <p className="text-sm text-gray-400">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
