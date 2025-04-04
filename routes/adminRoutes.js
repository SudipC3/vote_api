const express = require('express');
const VotingTime = require('../models/votingTime.js');
const {jwtAuthMiddleware, generateToken} = require('../jwt');

const router = express.Router();

router.post('/admin/voting-time', jwtAuthMiddleware, async (req, res) => {
    const { year, startDate, endDate, dailyStartTime, dailyEndTime } = req.body;
    
    try {
        const votingTime = new VotingTime({
            year,
            startDate,
            endDate,
            dailyStartTime,
            dailyEndTime
        });
        await votingTime.save();
        
        res.status(201).json({ message: `Voting time for ${year} set successfully!` });
    } catch (error) {
        res.status(500).json({ message: 'Error setting voting time', error });
    }
});

router.post('/admin/publish-result', jwtAuthMiddleware, async (req, res) => {
    const { year } = req.body;

    try {
        const votingTime = await VotingTime.findOne({ year });
        if (!votingTime) {
            return res.status(404).json({ message: "No voting time found for this year." });
        }

        votingTime.resultsPublished = true;
        await votingTime.save();

        res.status(200).json({ message: `Results for ${year} published successfully.` });
    } catch (error) {
        res.status(500).json({ message: 'Error publishing results', error });
    }
});



module.exports = router;
