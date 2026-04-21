import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { readDB, insertOne, updateOne, deleteOne, findById } from '../utils/db.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const allProjects = await readDB('projects');
    const userProjects = allProjects.filter(p => p.userId === req.user.id);
    userProjects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(userProjects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/marketplace', async (req, res) => {
  try {
    const allProjects = await readDB('projects');
    const publicProjects = allProjects.filter(p => p.isPublic);
    publicProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(publicProjects.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch marketplace' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await findById('projects', req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.userId !== req.user.id && !project.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, prompt, code, language, isPublic = false } = req.body;
    if (!title || !code) {
      return res.status(400).json({ error: 'Title and code are required' });
    }
    const project = {
      id: uuidv4(),
      title,
      prompt: prompt || '',
      code,
      language: language || 'javascript',
      userId: req.user.id,
      isPublic,
      deployUrl: null,
      clones: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await insertOne('projects', project);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await findById('projects', req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { title, prompt, code, language, isPublic } = req.body;
    const updated = await updateOne('projects', req.params.id, {
      title: title || project.title,
      prompt: prompt !== undefined ? prompt : project.prompt,
      code: code || project.code,
      language: language || project.language,
      isPublic: isPublic !== undefined ? isPublic : project.isPublic,
      updatedAt: new Date().toISOString()
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await findById('projects', req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await deleteOne('projects', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.post('/:id/clone', authMiddleware, async (req, res) => {
  try {
    const project = await findById('projects', req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!project.isPublic && project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const cloned = {
      id: uuidv4(),
      title: `${project.title} (Clone)`,
      prompt: project.prompt,
      code: project.code,
      language: project.language,
      userId: req.user.id,
      isPublic: false,
      deployUrl: null,
      clones: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await insertOne('projects', cloned);
    await updateOne('projects', project.id, { clones: (project.clones || 0) + 1 });
    res.status(201).json(cloned);
  } catch (err) {
    res.status(500).json({ error: 'Failed to clone project' });
  }
});

export default router;
