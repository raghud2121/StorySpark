const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
const Story = require('../models/Story');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid'); // Library for unique IDs

// --- 1. SETUP REDIS CONNECTION ---
const redisClient = createClient({
  url: 'redis://redis:6379' // 'redis' is the service name in docker-compose
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect immediately
(async () => {
  await redisClient.connect();
  console.log("✅ Connected to Redis!");
})();

// --- AUTH MIDDLEWARE ---
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, 'secrettoken');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST api/story/generate
router.post('/generate', auth, async (req, res) => {
  const { prompt } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const storyText = response.text();

    const newStory = new Story({
      user: req.user.id,
      prompt: prompt,
      content: storyText
    });

    const story = await newStory.save();
    res.json(story);
  } catch (error) {
    console.error("❌ Generation Error:", error);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/story/my-stories
router.get('/my-stories', auth, async (req, res) => {
  try {
    const stories = await Story.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/story/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ msg: 'Story not found' });
    if (story.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    await story.deleteOne();
    res.json({ msg: 'Story removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// --- NEW REDIS ROUTES ---

// @route   POST api/story/share/:id
// @desc    Generate a public link (cached in Redis for 24 hours)
router.post('/share/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    // Security: ensure user owns story
    if (story.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Generate a unique "share ID" (e.g., 550e8400-e29b...)
    const shareId = uuidv4();

    // Save to Redis: Key = shareId, Value = Story Content
    // EX: 86400 means it expires in 24 hours (86400 seconds)
    await redisClient.set(shareId, JSON.stringify(story), { EX: 86400 });

    res.json({ shareLink: shareId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/story/public/:shareId
// @desc    Get a story by its share ID (NO AUTH REQUIRED)
router.get('/public/:shareId', async (req, res) => {
  try {
    const shareId = req.params.shareId;
    
    // 1. Try to get from Redis
    const cachedStory = await redisClient.get(shareId);

    if (!cachedStory) {
      return res.status(404).json({ msg: 'Link expired or invalid' });
    }

    // 2. Return the data
    res.json(JSON.parse(cachedStory));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/story/refine/:id
// @desc    Create a NEW story version based on an old one
router.post('/refine/:id', auth, async (req, res) => {
  const { instruction } = req.body; 
  
  try {
    // 1. Find the ORIGINAL story (to use as context)
    const originalStory = await Story.findById(req.params.id);

    if (!originalStory) return res.status(404).json({ msg: 'Story not found' });
    if (originalStory.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    // 2. Construct prompt: Old Story + New Instruction
    const prompt = `
      ORIGINAL STORY:
      ${originalStory.content}

      USER INSTRUCTION:
      ${instruction}

      TASK:
      Write a NEW version of the story based on the instruction above. 
      Do not output the instruction, just the story.
    `;

    // 3. Generate New Content
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const newContent = response.text();

    // 4. SAVE AS A NEW ENTRY (Do not overwrite the old one)
    const newStory = new Story({
      user: req.user.id,
      prompt: `(Refined) ${instruction}`, // Label it as a refinement
      content: newContent
    });

    const savedStory = await newStory.save();
    res.json(savedStory);

  } catch (err) {
    console.error("Refine Error:", err);
    res.status(500).send('Server Error');
  }
});
// --- PUBLIC / GUEST ROUTES (No Auth Required) ---

// 1. Get a single story by ID (for the Guest View)
router.get('/public/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ msg: 'Story not found' });
    
    // Optional: You could fetch the whole conversation chain here if you linked them
    // For now, we return the specific story requested
    res.json(story);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 2. Guest Refine (Allows guest to generate new version)
router.post('/public/refine/:id', async (req, res) => {
  const { instruction } = req.body;
  try {
    const originalStory = await Story.findById(req.params.id);
    if (!originalStory) return res.status(404).json({ msg: 'Story not found' });

    // AI Generation
    const prompt = `
      ORIGINAL STORY: ${originalStory.content}
      USER INSTRUCTION: ${instruction}
      TASK: Write a NEW version based on the instruction.
    `;
    
    // Note: Ensure genAI is imported at the top of this file
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const newContent = response.text();

    // Create New Story (Linked to original user if possible, or leave user null)
    const newStory = new Story({
      user: originalStory.user, // Attribute it to the original owner so they see it
      prompt: `(Guest) ${instruction}`,
      content: newContent
    });

    const savedStory = await newStory.save();
    res.json(savedStory);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
module.exports = router;