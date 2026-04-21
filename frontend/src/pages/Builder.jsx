import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import DevBuddy from '../components/DevBuddy';
import {
  Zap, Play, Save, Download, Globe, LayoutDashboard, LogOut,
  Loader2, ChevronDown, Code2, Eye, Gamepad2, BookOpen, X,
  CheckCircle, AlertTriangle, Settings, RefreshCw, Copy, Share2
} from 'lucide-react';

const LANGUAGE_MAP = {
  javascript: 'javascript',
  typescript: 'typescript',
  html: 'html',
  css: 'css',
  python: 'python',
  csharp: 'csharp',
};

function getPreviewContent(code, language) {
  if (!code) return '';
  const trimmed = code.trimStart();
  if (language === 'html' || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return code;
  }
  if (language === 'javascript' || language === 'typescript') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0f; color: white; font-family: sans-serif; padding: 1rem; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
try {
${code}
} catch(e) {
  document.body.innerHTML = '<div style="color:#f87171;padding:1rem;font-family:monospace;"><strong>Error:</strong><br>' + e.message + '</div>';
}
  </script>
</body>
</html>`;
  }
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { background: #0a0a0f; color: white; font-family: monospace; padding: 1rem; }
    pre { background: #1e1e2e; padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
  </style>
</head>
<body>
  <pre><code>${escaped}</code></pre>
</body>
</html>`;
}

export default function Builder() {
  const { projectId } = useParams();
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('// Welcome to NovaBuilder!\n// Describe what you want to build above and click Generate.\n');
  const [language, setLanguage] = useState('javascript');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('code');
  const [beginnerMode, setBeginnerMode] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [aiResult, setAiResult] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const promptRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadProject = async (id) => {
    try {
      const res = await client.get(`/projects/${id}`);
      const p = res.data;
      setCurrentProject(p);
      setProjectTitle(p.title);
      setCode(p.code);
      setLanguage(p.language);
      setPrompt(p.prompt || '');
      if (p.deployUrl) setDeployUrl(p.deployUrl);
    } catch (err) {
      setError('Failed to load project');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    setGenerating(true);
    setError('');
    setAiResult(null);

    try {
      const res = await client.post('/generate', { prompt, beginnerMode });
      const data = res.data;
      setAiResult(data);
      setCode(data.code || '// No code generated');
      if (data.language) setLanguage(LANGUAGE_MAP[data.language] || 'javascript');
      if (data.filename && !currentProject) {
        setProjectTitle(data.filename.replace(/\.[^.]+$/, '') || 'Generated Project');
      }
      await refreshUser();
      setActiveTab('code');
      showSuccessMessage('Code generated successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Generation failed';
      if (err.response?.data?.upgradeRequired) {
        setError(`${msg} — Upgrade your plan to continue.`);
      } else {
        setError(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!code.trim()) { setError('No code to save'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: projectTitle,
        prompt,
        code,
        language,
        isPublic: currentProject?.isPublic || false,
      };
      if (currentProject) {
        const res = await client.put(`/projects/${currentProject.id}`, payload);
        setCurrentProject(res.data);
      } else {
        const res = await client.post('/projects', payload);
        setCurrentProject(res.data);
        navigate(`/builder/${res.data.id}`, { replace: true });
      }
      showSuccessMessage('Project saved!');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = async () => {
    if (!currentProject) {
      setError('Save your project first before deploying.');
      return;
    }
    setDeploying(true);
    setError('');
    try {
      const res = await client.post('/deploy', { projectId: currentProject.id });
      setDeployUrl(res.data.deployUrl);
      showSuccessMessage('Deployed successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Deploy failed';
      if (err.response?.data?.upgradeRequired) {
        setError(`${msg} — Upgrade to Pro.`);
      } else {
        setError(msg);
      }
    } finally {
      setDeploying(false);
    }
  };

  const handleExportUnity = async () => {
    if (!currentProject) { setError('Save project first'); return; }
    try {
      const res = await client.post('/deploy/unity/export', { projectId: currentProject.id }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}.cs`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccessMessage('Unity script exported!');
    } catch (err) {
      if (err.response?.data?.upgradeRequired) {
        setError('Unity export requires Pro or Studio plan.');
      } else {
        setError('Export failed');
      }
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    showSuccessMessage('Code copied!');
  };

  const showSuccessMessage = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const previewContent = getPreviewContent(code, language);
  const isUnityCode = language === 'csharp' || code.includes('MonoBehaviour') || code.includes('using UnityEngine');
  const generationsLeft = user?.plan === 'free' ? (user.generationsLimit - user.generationsUsed) : '∞';

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 glass border-b border-white/5 flex items-center px-4 gap-4 flex-shrink-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold gradient-text hidden sm:block">NovaBuilder</span>
        </button>

        <div className="flex-1 min-w-0">
          <input
            value={projectTitle}
            onChange={e => setProjectTitle(e.target.value)}
            className="bg-transparent text-white text-sm font-medium focus:outline-none hover:bg-white/5 rounded px-2 py-1 w-full max-w-xs truncate"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Beginner mode toggle */}
          <button
            onClick={() => setBeginnerMode(!beginnerMode)}
            title="Toggle Beginner Mode (DevBuddy explanations)"
            className={`p-2 rounded-lg transition-all text-xs font-medium ${beginnerMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <BookOpen size={16} />
          </button>

          <button
            onClick={copyCode}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            title="Copy code"
          >
            <Copy size={16} />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span className="hidden sm:block">Save</span>
          </button>

          {isUnityCode && (
            <button
              onClick={handleExportUnity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/20 transition-all"
              title="Export Unity C# Script"
            >
              <Download size={14} />
              <span className="hidden sm:block">.cs</span>
            </button>
          )}

          <button
            onClick={handleDeploy}
            disabled={deploying || !currentProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium border border-blue-500/20 transition-all disabled:opacity-50"
            title="Deploy project"
          >
            {deploying ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            <span className="hidden sm:block">Deploy</span>
          </button>

          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all" title="Dashboard">
            <LayoutDashboard size={16} />
          </button>
          <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Notifications */}
      {(error || success || deployUrl) && (
        <div className="px-4 py-2 flex-shrink-0 space-y-1">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 text-red-400 text-sm">
              <AlertTriangle size={14} />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')}><X size={14} /></button>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 text-emerald-400 text-sm">
              <CheckCircle size={14} />
              <span>{success}</span>
            </div>
          )}
          {deployUrl && !error && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2 text-blue-400 text-sm">
              <Globe size={14} />
              <span>Deployed:</span>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300 truncate max-w-xs">{deployUrl}</a>
            </div>
          )}
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Prompt + Editor */}
        <div className="flex flex-col w-1/2 border-r border-white/5">
          {/* Prompt area */}
          <div className="p-3 border-b border-white/5 flex-shrink-0">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
                  placeholder="Describe what you want to build... (Ctrl+Enter to generate)"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
                />
                <div className="absolute bottom-2 right-3 text-xs text-gray-600">
                  {user?.plan === 'free' && `${generationsLeft} left`}
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="btn-primary px-4 rounded-xl text-white font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {generating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Zap size={18} />
                )}
                <span className="hidden md:block">{generating ? 'Generating...' : 'Generate'}</span>
              </button>
            </div>

            {/* Beginner mode badge */}
            {beginnerMode && (
              <div className="mt-2 flex items-center gap-2 text-xs text-purple-300">
                <BookOpen size={12} />
                DevBuddy mode active — AI will explain the code
              </div>
            )}
          </div>

          {/* Editor tabs */}
          <div className="flex items-center border-b border-white/5 px-3 flex-shrink-0">
            {['code', 'explain'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-purple-400 border-purple-500'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {tab === 'code' ? <><Code2 size={12} className="inline mr-1" />Code</> : <><BookOpen size={12} className="inline mr-1" />Explain</>}
              </button>
            ))}
            {language !== 'csharp' && (
              <span className="ml-auto text-xs text-gray-600 pr-2">{language}</span>
            )}
            {isUnityCode && (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-400 pr-2">
                <Gamepad2 size={12} /> Unity C#
              </span>
            )}
          </div>

          {/* Editor / Explanation */}
          <div className="flex-1 min-h-0">
            {activeTab === 'code' ? (
              <Editor
                height="100%"
                language={LANGUAGE_MAP[language] || 'javascript'}
                value={code}
                onChange={val => setCode(val || '')}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  tabSize: 2,
                  automaticLayout: true,
                  padding: { top: 12 },
                }}
              />
            ) : (
              <div className="h-full overflow-auto p-4 text-sm text-gray-300">
                {aiResult?.explanation ? (
                  <div className="space-y-4">
                    <div className="glass rounded-xl p-4">
                      <h3 className="font-semibold text-purple-400 mb-2">What this does</h3>
                      <p>{aiResult.whatThisDoes || aiResult.explanation}</p>
                    </div>
                    {aiResult.steps?.length > 0 && (
                      <div className="glass rounded-xl p-4">
                        <h3 className="font-semibold text-blue-400 mb-2">Step by Step</h3>
                        <ol className="space-y-2">
                          {aiResult.steps.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-purple-400 font-bold">{i + 1}.</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {aiResult.tips?.length > 0 && (
                      <div className="glass rounded-xl p-4">
                        <h3 className="font-semibold text-emerald-400 mb-2">Tips</h3>
                        <ul className="space-y-1">
                          {aiResult.tips.map((t, i) => (
                            <li key={i} className="flex gap-2"><span className="text-emerald-400">•</span>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <BookOpen size={40} className="mb-3 opacity-40" />
                    <p>Generate code with DevBuddy mode enabled to see explanations here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex flex-col w-1/2">
          <div className="flex items-center border-b border-white/5 px-3 py-2 flex-shrink-0">
            <Eye size={14} className="text-gray-400 mr-2" />
            <span className="text-xs text-gray-400 font-medium">Live Preview</span>
            <button
              onClick={() => setCode(c => c + ' ')}
              className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              title="Refresh preview"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <div className="flex-1 bg-white">
            {isUnityCode ? (
              <div className="h-full flex flex-col items-center justify-center bg-[#1a1a2e] p-8 text-center">
                <Gamepad2 size={64} className="text-green-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Unity C# Script</h3>
                <p className="text-gray-400 mb-6 max-w-xs">This is a Unity MonoBehaviour script. Preview is not available for C# — use the Export button to download and use in Unity.</p>
                <button
                  onClick={handleExportUnity}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  <Download size={18} />
                  Export .cs Script
                </button>
              </div>
            ) : (
              <iframe
                srcDoc={previewContent}
                title="Live Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>

      {/* DevBuddy floating chat */}
      <DevBuddy context={{ code, prompt }} />
    </div>
  );
}
