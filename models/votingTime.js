const mongoose = require('mongoose');

const votingTimeSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true,
        unique: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    dailyStartTime: {
        type: String, // Format: "HH:mm" for easy parsing
        required: true
    },
    dailyEndTime: {
        type: String, // Format: "HH:mm"
        required: true
    },
    resultsPublished: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('VotingTime', votingTimeSchema);
