// const express = require('express');
// const router = express.Router();
// const { Group, User, Note } = require('../models');
// const { Op } = require('sequelize');
console.log("!!! GROUP ROUTES FILE HAS BEEN LOADED !!!");
const express = require('express');
const router = express.Router();
const models = require('../models'); // Import the whole object
const { Group, User, Note } = models; // Destructure from it
const authCheck = require('../middleware/authCheck');

console.log("Checking models:", { 
    isGroupDefined: !!Group, 
    isUserDefined: !!User, 
    isNoteDefined: !!Note 
});

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

// GET: Fetch all groups I belong to
router.get('/my-groups', async (req, res) => {
    try {
        const userId = req.user.id;

        const myGroups = await Group.findAll({
            include: [
                {
                    model: User,
                    where: { id: userId }, // Only groups where I am a member
                    attributes: [], // We don't need the user details, just the join
                    through: { attributes: [] }
                },
                {
                    model: Note, // Include notes belonging to the group
                }
            ]
        });

        res.json(myGroups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching groups" });
    }
});

module.exports = router;