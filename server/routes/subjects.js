const express = require('express');
const router = express.Router();
const { Subject, Note } = require('../models');
const authCheck = require('../middleware/authCheck');

// 1. GET all subjects and nested notes
router.get('/my-notes', authCheck, async (req, res) => {
  try {
    const data = await Subject.findAll({
      where: { UserId: req.user.id },
      include: [{ model: Note }]
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST a new subject (FOLDER)
// CHANGE THIS FROM .get TO .post
router.post('/create', authCheck, async (req, res) => {
  try {
    const newSubject = await Subject.create({
      name: req.body.name,
      UserId: req.user.id // This comes from the Passport session
    });
    res.json(newSubject);
  } catch (err) {
    console.error("Subject Creation Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authCheck, async (req, res) => {
  try {
    const { name } = req.body;
    await Subject.update({ name }, { where: { id: req.params.id, UserId: req.user.id } });
    res.json({ message: "Subject renamed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a subject
router.delete('/:id', authCheck, async (req, res) => {
  try {
    // Note: If you set up "onDelete: CASCADE" in your Sequelize associations, 
    // deleting the subject will automatically delete all notes inside it.
    await Subject.destroy({ where: { id: req.params.id, UserId: req.user.id } });
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;