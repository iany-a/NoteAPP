const express = require('express');
const router = express.Router();
const { Note, User, SharedNote } = require('../models');

// POST: Share a note with a colleague
router.post('/share-note', async (req, res) => {
    try {
        const { noteId, colleagueEmail, permission } = req.body;
        const ownerId = req.user.id; // From your Microsoft SSO middleware

        // 1. Verify the note exists and belongs to the sender
        const note = await Note.findOne({ where: { id: noteId, UserId: ownerId } });
        if (!note) {
            return res.status(404).json({ message: "Note not found or you don't own it" });
        }

        // 2. Find the colleague by email
        const colleague = await User.findOne({ where: { email: colleagueEmail } });
        if (!colleague) {
            return res.status(404).json({ message: "Student with this email not found" });
        }

        // 3. Prevent sharing with yourself
        if (colleague.id === ownerId) {
            return res.status(400).json({ message: "You cannot share a note with yourself" });
        }

        // 4. Create the share entry
        const sharedEntry = await SharedNote.findOrCreate({
            where: { NoteId: noteId, SharedWithUserId: colleague.id },
            defaults: { permission: permission || 'read' }
        });

        res.status(200).json({ message: `Note shared with ${colleague.name}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during sharing" });
    }
});

module.exports = router;