import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  Zap, Plus, LogOut, Code2, Globe, Trash2, Copy, Edit3,
  LayoutDashboard, Clock, Star, AlertTriangle, CheckCircle, X
} from 'lucide-react';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setSuccess('Plan upgraded successfully! Welcome to the new tier.');
      refreshUser();
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await client.get('/projects');
      setProjects(res.data);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    setDeleting(id);
    try {
      await client.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x.id !== id));
      setSuccess('Project deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublic = async (project) => {
    try {
      const res = await client.put(`/projects/${project.id}`, { isPublic: !project.isPublic });
      setProjects(p => p.map(x => x.id === project.id ? res.data : x));
    } catch {
      setError('Failed to update project');
    }
  };

  const planColors = {
    free: 'text-gray-400 bg-gray-500/10',
    pro: 'text-purple-400 bg-purple-500/10',
    studio: 'text-blue-400 bg-blue-500/10',
  };

  const generationsLeft = user?.plan === 'free'
    ? Math.max(0, (user.generationsLimit || 10) - (user.generationsUsed || 0))
    : '∞';

  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-bg">
      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">NovaBuilder</span>
        </button>

        <div className="flex-1" />

        <button onClick={() => navigate('/marketplace')} className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
          Marketplace
        </button>
        <button
          onClick={() => navigate('/builder')}
          className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
        >
          <Plus size={16} /> New Project
        </button>
        <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut size={16} />
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
            <AlertTriangle size={14} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')}><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 text-sm mb-6">
            <CheckCircle size={14} />
            <span>{success}</span>
          </div>
        )}

        {/* User stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-2xl p-5 md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="font-semibold text-white">{user?.name}</div>
                <div className="text-sm text-gray-400">{user?.email}</div>
              </div>
            </div>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${planColors[user?.plan] || planColors.free}`}>
              <Star size={10} />
              {(user?.plan || 'free').charAt(0).toUpperCase() + (user?.plan || 'free').slice(1)} Plan
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-3xl font-black gradient-text mb-1">{projects.length}</div>
            <div className="text-sm text-gray-400">Total Projects</div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-3xl font-black gradient-text mb-1">{generationsLeft}</div>
            <div className="text-sm text-gray-400">
              {user?.plan === 'free' ? 'Generations Left' : 'Unlimited Generations'}
            </div>
            {user?.plan === 'free' && (
              <button
                onClick={() => navigate('/pricing')}
                className="text-xs text-purple-400 hover:text-purple-300 mt-1 transition-colors"
              >
                Upgrade for unlimited →
              </button>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Your Projects</h2>
          <button
            onClick={() => navigate('/builder')}
            className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
          >
            <Plus size={16} /> New
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Code2 size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">Start building with AI. Describe your idea and watch it come to life.</p>
            <button
              onClick={() => navigate('/builder')}
              className="btn-primary px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2"
            >
              <Zap size={18} /> Create First Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div key={project.id} className="glass rounded-2xl p-5 hover:border-purple-500/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{project.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-gray-400">
                        {project.language}
                      </span>
                      {project.isPublic && (
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {project.prompt && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.prompt}</p>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-600 mb-4">
                  <Clock size={10} />
                  {formatDate(project.updatedAt)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/builder/${project.id}`)}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-purple-500/20 text-white text-sm font-medium transition-all flex items-center justify-center gap-1"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  {project.deployUrl && (
                    <a
                      href={project.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                      title="View deployed site"
                    >
                      <Globe size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => handleTogglePublic(project)}
                    className={`p-2 rounded-lg transition-all ${project.isPublic ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    title={project.isPublic ? 'Make private' : 'Make public'}
                  >
                    <Star size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={deleting === project.id}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50"
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
