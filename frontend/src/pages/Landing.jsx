import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Code2, Gamepad2, Globe, Cpu, ArrowRight, Star, Users, Rocket, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Cpu, title: 'AI Code Generation', desc: 'Describe what you want in plain English. Get production-ready code instantly.', color: 'from-purple-500 to-blue-500' },
  { icon: Code2, title: 'Monaco Editor', desc: 'Full VS Code editor in the browser. Syntax highlighting, autocomplete, and more.', color: 'from-blue-500 to-cyan-500' },
  { icon: Globe, title: 'Live Preview', desc: 'See your code run in real-time. Instant iframe preview for HTML/JS apps.', color: 'from-cyan-500 to-emerald-500' },
  { icon: Gamepad2, title: 'Unity Game Dev', desc: 'Generate complete Unity C# scripts. Export FPS, RPG, Racing games instantly.', color: 'from-pink-500 to-purple-500' },
  { icon: Rocket, title: 'One-Click Deploy', desc: 'Deploy your projects to the web instantly. Share with a URL.', color: 'from-orange-500 to-pink-500' },
  { icon: Shield, title: 'DevBuddy AI', desc: 'Your personal AI coding copilot. Get help, explanations, and code fixes.', color: 'from-emerald-500 to-blue-500' },
];

const TEMPLATES = [
  { title: 'FPS Shooter', icon: '🎮', desc: 'Unity FPS with player controller, weapons & enemies', tag: 'Unity C#' },
  { title: 'Landing Page', icon: '🌐', desc: 'Beautiful responsive landing page with animations', tag: 'HTML/CSS' },
  { title: 'React Dashboard', icon: '📊', desc: 'Admin dashboard with charts and data tables', tag: 'React' },
  { title: 'Racing Game', icon: '🏎️', desc: 'Unity car controller with AI opponents', tag: 'Unity C#' },
  { title: 'REST API', icon: '⚡', desc: 'Express.js CRUD API with authentication', tag: 'Node.js' },
  { title: 'RPG Adventure', icon: '⚔️', desc: 'Unity RPG with quests, inventory & dialogue', tag: 'Unity C#' },
];

const STATS = [
  { value: '10K+', label: 'Projects Created' },
  { value: '500+', label: 'Active Builders' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 5s', label: 'Generation Time' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">NovaBuilder</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <button onClick={() => navigate('/marketplace')} className="hover:text-white transition-colors">Marketplace</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/builder')}
                className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              >
                Open Builder <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth')}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 grid-bg">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            AI-Powered Code Generation Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Build{' '}
            <span className="gradient-text">Anything</span>
            {' '}with{' '}
            <span className="gradient-text neon-purple">AI</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Describe your idea. Get complete, production-ready code instantly.
            From Unity games to React apps — NovaBuilder generates, you build.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate(user ? '/builder' : '/auth')}
              className="btn-primary px-8 py-4 rounded-xl text-lg font-bold text-white flex items-center justify-center gap-2"
            >
              <Zap size={20} />
              Start Building Free
              <ArrowRight size={20} />
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-8 py-4 rounded-xl text-lg font-semibold text-white border border-white/10 hover:border-purple-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <Star size={20} />
              Browse Projects
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="glass rounded-2xl p-4">
                <div className="text-3xl font-black gradient-text mb-1">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 gradient-text">Everything You Need to Build</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              From code generation to deployment — NovaBuilder handles it all.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass rounded-2xl p-6 hover:border-purple-500/40 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-purple-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Start with a Template</h2>
            <p className="text-gray-400 text-xl">Pick a template, customize with AI, ship in minutes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map(({ title, icon, desc, tag }) => (
              <button
                key={title}
                onClick={() => navigate(user ? '/builder' : '/auth')}
                className="glass rounded-2xl p-6 text-left hover:border-purple-500/40 hover:bg-white/5 transition-all group"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">{title}</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{tag}</span>
                </div>
                <p className="text-gray-400 text-sm">{desc}</p>
                <div className="mt-4 flex items-center gap-1 text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                  Use Template <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl font-black mb-4 gradient-text">Ready to Build?</h2>
              <p className="text-gray-400 text-xl mb-8">
                Join thousands of developers building with AI. Free to start.
              </p>
              <button
                onClick={() => navigate(user ? '/builder' : '/auth')}
                className="btn-primary px-10 py-4 rounded-xl text-lg font-bold text-white inline-flex items-center gap-2"
              >
                <Zap size={20} />
                Launch NovaBuilder
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-white">NovaBuilder</span>
        </div>
        <p>© {new Date().getFullYear()} NovaBuilder. Build the future with AI.</p>
      </footer>
    </div>
  );
}
