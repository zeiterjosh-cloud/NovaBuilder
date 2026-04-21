import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Zap, Copy, Code2, Globe, Star, Clock, ArrowLeft, Search } from 'lucide-react';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Marketplace() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cloning, setCloning] = useState(null);
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      const res = await client.get('/projects/marketplace');
      setProjects(res.data);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (projectId) => {
    if (!user) { navigate('/auth'); return; }
    setCloning(projectId);
    try {
      const res = await client.post(`/projects/${projectId}/clone`);
      setSuccess(`Cloned! Opening in editor...`);
      setTimeout(() => {
        navigate(`/builder/${res.data.id}`);
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setCloning(null);
    }
  };

  const filtered = projects.filter(p =>
    search === '' ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.prompt?.toLowerCase().includes(search.toLowerCase())
  );

  const LANG_EMOJI = {
    javascript: '🟨',
    typescript: '🔷',
    html: '🌐',
    css: '🎨',
    csharp: '🎮',
    python: '🐍',
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
          <button onClick={() => navigate('/builder')} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
            <Zap size={14} /> Build
          </button>
        ) : (
          <button onClick={() => navigate('/auth')} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white">
            Get Started
          </button>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black gradient-text mb-4">Project Marketplace</h1>
          <p className="text-gray-400 text-xl">Browse, clone, and remix community projects</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 text-sm mb-6 text-center">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Globe size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {search ? 'No results found' : 'No public projects yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {search ? 'Try a different search term' : 'Be the first to share your project!'}
            </p>
            {!search && (
              <button
                onClick={() => navigate(user ? '/builder' : '/auth')}
                className="btn-primary px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2"
              >
                <Zap size={16} /> Create & Share
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(project => (
              <div key={project.id} className="glass rounded-2xl p-6 hover:border-purple-500/30 transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{LANG_EMOJI[project.language] || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{project.title}</h3>
                    <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-gray-400">
                      {project.language}
                    </span>
                  </div>
                </div>

                {project.prompt && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.prompt}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
                  <span className="flex items-center gap-1"><Clock size={10} />{formatDate(project.createdAt)}</span>
                  {project.clones > 0 && (
                    <span className="flex items-center gap-1"><Copy size={10} />{project.clones} clones</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleClone(project.id)}
                    disabled={cloning === project.id}
                    className="flex-1 py-2.5 rounded-xl btn-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {cloning === project.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Copy size={14} /> Clone &amp; Edit</>
                    )}
                  </button>
                  {project.deployUrl && (
                    <a
                      href={project.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                      title="View live demo"
                    >
                      <Globe size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
