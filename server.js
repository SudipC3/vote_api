const express = require('express')
const app = express();
const cors = require('cors'); 
const db = require('./db');
require('dotenv').config();

app.use(cors());
const bodyParser = require('body-parser'); 
app.use(bodyParser.json()); // req.body
const PORT = process.env.PORT || 3000;

// Import the router files
const userRoutes = require('./routes/userRoutes.js');
const candidateRoutes = require('./routes/candidateRoutes');

// Use the routers
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);



app.get('/test', (req, res) => {
    res.send('API is working!');
});

app.listen(PORT, ()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})