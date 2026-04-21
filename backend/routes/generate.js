import express from 'express';
import OpenAI from 'openai';
import { authMiddleware } from '../middleware/auth.js';
import { findById, updateOne, readDB, insertOne } from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function detectGameType(prompt) {
  const lower = prompt.toLowerCase();
  // Use word-boundary aware patterns to avoid false positives (e.g. "aircraft" matching "craft")
  const word = (str) => new RegExp(`\\b${str}\\b`).test(lower);
  if (word('fps') || word('shooter') || /first[- ]person/.test(lower)) return 'FPS';
  if (word('racing') || word('driving') || word('gta') || /\bcar\s+(game|racing|sim)/.test(lower)) return 'Racing';
  if (word('rpg') || /role[- ]playing/.test(lower) || word('quest')) return 'RPG';
  if (word('platformer') || /side[- ]scroll/.test(lower) || /\bplatform\s+(game|level)/.test(lower)) return 'Platformer';
  if (word('sandbox') || word('minecraft') || /\bcraft(ing)?\s+(game|system|world)/.test(lower)) return 'Sandbox';
  if (word('game') || word('unity') || word('player') || word('enemy')) return 'Generic';
  return null;
}

function buildSystemPrompt(beginnerMode, gameType) {
  const base = `You are NovaBuilder AI, an expert full-stack developer and Unity game developer.
When asked to generate code, you produce complete, working, production-ready code.`;

  const gameContext = gameType ? `
The user wants to build a ${gameType} game using Unity C#.
Generate complete Unity C# MonoBehaviour scripts that cover all the core systems needed for this game type.
For FPS: include PlayerMovement, CameraController, WeaponSystem, EnemyAI, HealthSystem, HUDManager scripts.
For Racing: include CarController, RaceManager, AIDriver, LapTimer scripts.
For RPG: include PlayerController, InventorySystem, QuestManager, DialogueSystem, EnemyAI scripts.
For Platformer: include PlayerController, EnemyController, CoinCollector, LevelManager scripts.
For Sandbox: include PlayerController, WorldGenerator, InventorySystem, CraftingSystem scripts.
Always wrap each script in proper Unity MonoBehaviour class structure.` : '';

  if (beginnerMode) {
    return `${base}${gameContext}
You are also DevBuddy, a friendly coding teacher.
ALWAYS structure your response as JSON with this exact format:
{
  "code": "the complete code here",
  "explanation": "A friendly explanation of what this code does",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "whatThisDoes": "A simple summary of what this code does",
  "tips": ["Tip 1: ...", "Tip 2: ..."]
}
Add helpful comments inside the code explaining each section.`;
  } else {
    return `${base}${gameContext}
Return ONLY a JSON object with this format:
{
  "code": "the complete production-ready code here",
  "language": "javascript|typescript|csharp|html|python",
  "filename": "suggested filename",
  "description": "brief one-line description"
}
No explanations, no extra text. Clean production code only.`;
  }
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { prompt, beginnerMode = false } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const user = await findById('users', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.plan === 'free' && user.generationsUsed >= user.generationsLimit) {
      return res.status(403).json({
        error: 'Generation limit reached. Upgrade to Pro for unlimited generations.',
        upgradeRequired: true
      });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      const mockCode = generateMockCode(prompt, beginnerMode);
      await updateOne('users', user.id, { generationsUsed: (user.generationsUsed || 0) + 1 });
      await saveMemory(user.id, prompt);
      return res.json(mockCode);
    }

    const openai = getOpenAI();
    const gameType = detectGameType(prompt);
    const systemPrompt = buildSystemPrompt(beginnerMode, gameType);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { code: responseText, language: 'javascript', description: prompt };
    }

    parsed.gameType = gameType;
    parsed.isUnityGame = !!gameType;

    await updateOne('users', user.id, { generationsUsed: (user.generationsUsed || 0) + 1 });
    await saveMemory(user.id, prompt);

    res.json(parsed);
  } catch (err) {
    console.error('Generate error:', err);
    if (err.code === 'insufficient_quota') {
      return res.status(503).json({ error: 'OpenAI quota exceeded. Please check your API key.' });
    }
    res.status(500).json({ error: 'Generation failed: ' + err.message });
  }
});

async function saveMemory(userId, prompt) {
  try {
    const memory = {
      id: uuidv4(),
      userId,
      type: 'generation',
      content: prompt,
      timestamp: new Date().toISOString()
    };
    await insertOne('memories', memory);
  } catch {}
}

function generateMockCode(prompt, beginnerMode) {
  const lower = prompt.toLowerCase();
  const isGame = lower.includes('game') || lower.includes('unity') || lower.includes('fps') || lower.includes('player');

  let code, language, filename, description;

  if (isGame) {
    language = 'csharp';
    filename = 'PlayerController.cs';
    description = 'Unity player controller generated by NovaBuilder AI';
    code = `using UnityEngine;

/// <summary>
/// NovaBuilder AI Generated: ${prompt}
/// </summary>
public class PlayerController : MonoBehaviour
{
    [Header("Movement Settings")]
    public float moveSpeed = 5f;
    public float sprintSpeed = 10f;
    public float jumpForce = 7f;
    public float mouseSensitivity = 2f;

    [Header("References")]
    public Camera playerCamera;
    public Transform groundCheck;
    public LayerMask groundLayer;

    private Rigidbody rb;
    private float verticalRotation = 0f;
    private bool isGrounded;
    private float groundDistance = 0.4f;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        Cursor.lockState = CursorLockMode.Locked;
        if (playerCamera == null)
            playerCamera = Camera.main;
    }

    void Update()
    {
        HandleMouseLook();
        HandleJump();
    }

    void FixedUpdate()
    {
        HandleMovement();
        CheckGround();
    }

    void HandleMovement()
    {
        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");
        bool isSprinting = Input.GetKey(KeyCode.LeftShift);
        float speed = isSprinting ? sprintSpeed : moveSpeed;

        Vector3 direction = transform.right * horizontal + transform.forward * vertical;
        direction = direction.normalized * speed;
        direction.y = rb.linearVelocity.y;
        rb.linearVelocity = direction;
    }

    void HandleMouseLook()
    {
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

        verticalRotation -= mouseY;
        verticalRotation = Mathf.Clamp(verticalRotation, -90f, 90f);

        if (playerCamera != null)
            playerCamera.transform.localRotation = Quaternion.Euler(verticalRotation, 0f, 0f);

        transform.Rotate(Vector3.up * mouseX);
    }

    void HandleJump()
    {
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
        }
    }

    void CheckGround()
    {
        isGrounded = Physics.CheckSphere(
            groundCheck != null ? groundCheck.position : transform.position - Vector3.up * 0.5f,
            groundDistance,
            groundLayer
        );
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(
            groundCheck != null ? groundCheck.position : transform.position - Vector3.up * 0.5f,
            groundDistance
        );
    }
}`;
  } else if (lower.includes('website') || lower.includes('landing') || lower.includes('html')) {
    language = 'html';
    filename = 'index.html';
    description = 'Landing page generated by NovaBuilder AI';
    code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated by NovaBuilder AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%);
      color: #fff;
      min-height: 100vh;
    }
    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 2rem;
    }
    h1 {
      font-size: 4rem;
      font-weight: 800;
      background: linear-gradient(135deg, #a855f7, #3b82f6, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1.5rem;
    }
    p { font-size: 1.25rem; color: #94a3b8; max-width: 600px; margin-bottom: 2rem; }
    .btn {
      padding: 1rem 2.5rem;
      background: linear-gradient(135deg, #a855f7, #3b82f6);
      color: white;
      border: none;
      border-radius: 0.75rem;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      display: inline-block;
    }
    .btn:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(168, 85, 247, 0.5); }
  </style>
</head>
<body>
  <div class="hero">
    <h1>NovaBuilder AI</h1>
    <p>Built with NovaBuilder AI — Generate, Edit, Deploy instantly.</p>
    <a href="#" class="btn">Get Started</a>
  </div>
</body>
</html>`;
  } else {
    language = 'javascript';
    filename = 'app.js';
    description = 'Application generated by NovaBuilder AI';
    code = `// NovaBuilder AI Generated
// Prompt: ${prompt}

class App {
  constructor() {
    this.data = [];
    this.init();
  }

  async init() {
    console.log('App initialized');
    this.render();
  }

  async fetchData() {
    const response = await fetch('/api/data');
    this.data = await response.json();
    this.render();
  }

  render() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = \`
      <div style="font-family: sans-serif; padding: 2rem; background: #0a0a0f; color: white; min-height: 100vh;">
        <h1 style="color: #a855f7;">Generated App</h1>
        <p style="color: #94a3b8;">Built with NovaBuilder AI</p>
        <button onclick="app.fetchData()" style="
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #a855f7, #3b82f6);
          color: white; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem;
        ">Load Data</button>
      </div>
    \`;
  }
}

const app = new App();`;
  }

  if (beginnerMode) {
    return {
      code, language, filename, description,
      explanation: `This code was generated based on your prompt. It creates a ${description}.`,
      steps: [
        'Step 1: The code sets up the basic structure',
        'Step 2: Core functionality is implemented',
        'Step 3: UI/rendering is handled',
        'Step 4: Event handlers connect user interactions'
      ],
      whatThisDoes: `This is a ${description} that you can customize and build upon.`,
      tips: [
        'You can modify the styling to match your brand',
        'Add more features by extending the class',
        'Use the Monaco editor above to edit this code directly'
      ]
    };
  }

  return { code, language, filename, description };
}

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const user = await findById('users', req.user.id);

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.json({
        reply: `I'm DevBuddy! You asked: "${message}". Configure your OpenAI API key in the backend .env file for full AI-powered responses.`
      });
    }

    const openai = getOpenAI();

    let memories = [];
    try {
      const allMemories = await readDB('memories');
      memories = allMemories.filter(m => m.userId === user.id).slice(-5);
    } catch {}

    const systemPrompt = `You are DevBuddy, an AI coding copilot inside NovaBuilder.
You help users understand code, fix bugs, and improve their projects.
Be concise, helpful, and friendly. Use code examples when relevant.
${context?.code ? `Current project code:\n\`\`\`\n${context.code.slice(0, 1000)}\n\`\`\`` : ''}
${context?.prompt ? `Current project prompt: ${context.prompt}` : ''}
${memories.length > 0 ? `User recent activities: ${memories.map(m => m.content).join(', ')}` : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed: ' + err.message });
  }
});

export default router;
