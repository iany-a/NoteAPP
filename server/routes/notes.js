const express = require('express');
const router = express.Router();
const { Note } = require('../models');
const authCheck = require('../middleware/authCheck');
const multer = require('multer');
const path = require('path');

// Configure where to save images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// The actual route
router.post('/upload-image', authCheck, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  // Return the URL so the frontend can use it
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// POST create a new note
router.post('/', authCheck, async (req, res) => {
  try {
    const { title, subjectId, groupId } = req.body;
    
    // Safety check: Ensure it's attached to SOMETHING
    if (!subjectId && !groupId) {
      return res.status(400).json({ error: "Note must belong to a Subject or a Group" });
    }

    const newNote = await Note.create({
      title: title || 'Untitled Note',
      content: '', 
      UserId: req.user.id,
      // If subjectId is provided, it saves it. If not, it's null.
      SubjectId: subjectId || null, 
      // If groupId is provided, it saves it. If not, it's null.
      GroupId: groupId || null     
    });
    
    res.json(newNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update an existing note (for the Save button)
router.put('/:id', authCheck, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).send('Note not found');

    // Update both title and content
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', authCheck, async (req, res) => {
  try {
    const deleted = await Note.destroy({
      where: { id: req.params.id }
    });

    if (deleted) {
      res.status(200).json({ message: "Note deleted successfully" });
    } else {
      res.status(404).json({ message: "Note not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;