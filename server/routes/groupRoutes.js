const express = require('express');
const router = express.Router();
const { Group, User, Note } = require('../models');

// POST: Create a study group
router.post('/create', async (req, res) => {
    try {
        const { name } = req.body;
        const creatorId = req.user.id; // Ensure your auth middleware is working

        const newGroup = await Group.create({
            name,
            CreatorId: creatorId,
            // Generates a 6-character random code like "A7B2X9"
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
        });

        // Automatically add the creator as a member of their own group
        await newGroup.addUser(creatorId); 

        res.status(201).json(newGroup);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating study group" });
    }
});

// POST: Join a group using an invite code
router.post('/join', async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const userId = req.user.id;

        const group = await Group.findOne({ where: { inviteCode } });
        
        if (!group) {
            return res.status(404).json({ message: "Invalid invite code" });
        }

        // Add the user to the group
        await group.addUser(userId);

        res.status(200).json({ message: "Joined group successfully", group });
    } catch (err) {
        res.status(500).json({ message: "Error joining group" });
    }
});

module.exports = router;