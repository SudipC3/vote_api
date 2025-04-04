const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('../jwt');
const Candidate = require('../models/candidate');


const checkAdminRole = async (userID) => {
   try{
        const user = await User.findById(userID);
        if(user.role === 'admin'){
            return true;
        }
   }catch(err){
        return false;
   }
}

// POST route to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res) =>{
    const { name, party, age } = req.body;

    try {
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});

        // Validate request body
        if (!name || !party || !age) {
            return res.status(400).json({ error: 'All fields (name, party, age) are required.' });
        }
        // Create a new candidate instance
        const newCandidate = new Candidate({
            name,
            party,
            age,
            votes: [],
            voteCountsByYear: []
        });

        // Save the candidate to the database
        await newCandidate.save();

        res.status(201).json({ message: 'Candidate created successfully', candidate: newCandidate });
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter

        const response = await Candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate deleted');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// let's start voting
router.post('/vote', jwtAuthMiddleware, async (req, res)=>{
    // no admin can vote
    // user can only vote once
    const { candidateId } = req.body;
    const currentYear = new Date().getFullYear();
    const userId = req.user._id;

    try {
        // Check if user has already voted this year
        const user = await User.findById(userId);
        if (user.votingHistory.some(vote => vote.year === currentYear)) {
            return res.status(400).json({ message: "You've already voted this year." });
        }

        // Validate voting time for the current year
        const votingTime = await VotingTime.findOne({ year: currentYear });
        if (!votingTime) {
            return res.status(400).json({ message: "Voting period not set for this year." });
        }

        const now = new Date();
        if (now < votingTime.startDate || now > votingTime.endDate) {
            return res.status(400).json({ message: "Voting is not open for this period." });
        }

        const [hour, minute] = now.toTimeString().split(':');
        const [dailyStartHour, dailyStartMinute] = votingTime.dailyStartTime.split(':');
        const [dailyEndHour, dailyEndMinute] = votingTime.dailyEndTime.split(':');

        const isWithinDailyTime = (
            (hour > dailyStartHour || (hour == dailyStartHour && minute >= dailyStartMinute)) &&
            (hour < dailyEndHour || (hour == dailyEndHour && minute <= dailyEndMinute))
        );

        if (!isWithinDailyTime) {
            return res.status(400).json({ message: "Voting is only allowed between the set hours." });
        }

        // Record the vote
        await Candidate.findByIdAndUpdate(candidateId, {
            $push: {
                votes: { user: userId, votedAt: now, year: currentYear }
            },
            $inc: { "voteCountsByYear.$[elem].count": 1 }
        }, { arrayFilters: [{ "elem.year": currentYear }], upsert: true });

        user.votingHistory.push({ year: currentYear, partyVoted: candidateId });
        await user.save();

        res.status(200).json({ message: "Vote recorded successfully!" });
    }  catch (error) {
        console.error('Error registering vote:', error);
        res.status(500).json({ error: 'An error occurred while registering the vote' });
    }
});


// Get List of all candidates with only name and party fields 
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/total-vote-count', jwtAuthMiddleware, async (req, res) => {
    try {

        // Retrieve all candidates and calculate total votes
        const candidates = await Candidate.find();

        const totalVoteCounts = candidates.map(candidate => {
            const totalVotes = candidate.voteCountsByYear.reduce((sum, entry) => sum + entry.count, 0);
            return {
                name: candidate.name,
                party: candidate.party,
                totalVotes: totalVotes
            };
        });

        res.status(200).json(totalVoteCounts);
    } catch (error) {
        console.error('Error retrieving total vote count:', error);
        res.status(500).json({ error: 'An error occurred while retrieving total vote counts' });
    }
});

module.exports = router;