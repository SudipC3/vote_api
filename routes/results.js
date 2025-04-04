const express = require('express');
const VotingTime = require('../models/votingTime.js');
const {jwtAuthMiddleware, generateToken} = require('../jwt');

const router = express.Router();

router.get('/results/:year', authUser, async (req, res) => {
    const { year } = req.params;

    try {
        const votingTime = await VotingTime.findOne({ year });
        if (!votingTime || (!votingTime.resultsPublished && req.user.role !== 'admin')) {
            return res.status(403).json({ message: "Results not available for this year." });
        }

        const candidates = await Candidate.find({}, 'name party voteCountsByYear')
            .lean()
            .exec();

        const result = candidates.map(candidate => ({
            name: candidate.name,
            party: candidate.party,
            votes: candidate.voteCountsByYear.find(count => count.year === parseInt(year))?.count || 0
        }));

        res.status(200).json({ year, result });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error });
    }
});

module.exports = router;
