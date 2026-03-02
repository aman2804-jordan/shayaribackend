require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require("bcryptjs");   // or "bcrypt"
const jwt = require("jsonwebtoken");

const app = express();

// ✅ middleware FIRST
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://shayarifrontend.vercel.app/",
  credentials: true
}));
 // replaces body-parser

// Mongo connect
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


  // User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("users", UserSchema);

// Schema & model
const ShayariSchema = new mongoose.Schema({
  username: String,
  email: String,
  shayari: String,
  status: String
}, { timestamps: true });
const Shayari = mongoose.model('Shayari', ShayariSchema);

// GET route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// POST route
app.post('/api/shayari', async (req, res) => {
  try {
    console.log('POST /api/shayari body:', req.body); // 👀 TEMP log
    const newEntry = new Shayari({
      username: req.body.username,
      email: req.body.email,
      shayari: req.body.shayari,
      status: 'PENDING',
    });
    await newEntry.save();
    res.status(201).json({ ok: true, message: 'Thank you! Your shayari was submitted.' });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ ok: false, error: 'Failed to save shayari' });
  }
});




// ... your other routes ...
// Get all pending shayaris
app.get('/api/pending-shayari', async (req, res) => {
  try {
    const pending = await Shayari.find({ status: "PENDING" }).sort({ createdAt: -1 });
    res.status(200).json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending shayari' });
  }
});

// Approve shayari
app.put('/api/shayari/approve/:id', async (req, res) => {
  try {
    await Shayari.findByIdAndUpdate(req.params.id, { status: "APPROVED" });
    res.json({ message: "Shayari approved!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve shayari' });
  }
});

// Reject/Delete shayari
app.delete('/api/shayari/reject/:id', async (req, res) => {
  try {
    await Shayari.findByIdAndDelete(req.params.id);
    res.json({ message: "Shayari rejected & deleted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject shayari' });
  }
});
app.get('/getAllShayari', async (req, res) => { 
  try { const allShayari = await Shayari.find().sort({ createdAt: -1 }); // Optional: latest first 
  res.status(200).json(allShayari); } 
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch shayari' }); 
}});


// Login API
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or email" });

    // Compare password
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET, // keep in .env for security
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));