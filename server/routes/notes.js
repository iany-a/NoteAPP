const express = require('express');
const router = express.Router();
const { Note } = require('../models');
const authCheck = require('../middleware/authCheck');

// POST create a new note
router.post('/', authCheck, async (req, res) => {
  try {
    const { title, subjectId } = req.body;
    const newNote = await Note.create({
      title: title || 'Untitled Note',
      content: '', // Start empty
      SubjectId: subjectId,
      UserId: req.user.id
    });
    res.json(newNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update an existing note (for the Save button)
router.put('/:id', authCheck, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id } });
    if (!note) return res.status(404).send('Note not found');

    // Update both title and content
    note.title = req.body.title;
    note.content = req.body.content;
    
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