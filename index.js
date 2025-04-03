require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 6000;
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("🚨 ERROR: GROQ_API_KEY is missing in .env file");
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Groq SDK
const groq = new Groq({ apiKey });

// Function to extract only JavaScript code from AI response
function extractJavaScriptCode(responseText) {
  const match = responseText.match(/```js\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : responseText.trim();
}

// Route to generate Phaser.js game code using Groq AI
app.post("/generate-game", async (req, res) => {
  const SYSTEM_PROMPT = `You are an expert game developer specializing in creating 2D games using Phaser.js. Your task is to generate **fully functional and complete Phaser.js game code** based on a given game description.

### **Guidelines for the generated code:**
1. **Complete Scene Class:** Define a Phaser scene named 'gameScene' with preload(), create(), and update() methods.
2. **Game Assets:**
   - Use **real, publicly available URLs** for all required assets (images, sprites, sounds).
3. **Physics and Mechanics:**
   - Implement proper **physics and collision handling**.
   - Ensure smooth movement and interactions.
4. **Game Logic:**
   - Implement **score tracking** and UI updates.
   - Define clear **win/lose conditions**.
   - Provide **restart functionality** for replayability.
5. **Controls:**  
   - Use **arrow keys** for movement.
   - Spacebar or Enter for additional actions (jump, attack, shoot, etc.).
6. **Output Requirement:**
   - **Return only valid Phaser.js code** wrapped in JavaScript syntax (\`\`\`js ... \`\`\`).
   - **No extra text, explanations, or comments.**
   - The code must be **ready to run** in a browser.

Now generate the game code based on the user’s description.`;

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      model: "llama3-70b-8192",
    });

    let gameCode = response.choices[0]?.message?.content.trim();
    gameCode = extractJavaScriptCode(gameCode); // Extract JS code only

    if (!gameCode.includes("Phaser")) {
      return res
        .status(500)
        .json({ error: "Invalid Phaser.js code generated." });
    }

    res.json({ gameCode });
  } catch (error) {
    console.error("Error generating game code:", error);
    res.status(500).json({ error: "Failed to generate game code." });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
