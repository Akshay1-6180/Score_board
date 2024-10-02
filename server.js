const express = require('express');
const xlsx = require('xlsx');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.static('public')); // Serve static files from the public directory

// Global players array to hold the scoreboard data
let players = [];

// Function to load data from the Excel file
const loadExcelData = () => {
    const workbook = xlsx.readFile('scoreboard.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    players = data.map((player, index) => ({
        name: player['Dancer'],
        round1: player['Round 1'] || 0,
        round2: player['Round 2'] || 0,
        final: player['Final Score'] || 0,
        index: index
    }));
};

// Function to save the current state of players to the Excel file
const saveToExcel = () => {
    const worksheet = xlsx.utils.json_to_sheet(players.map(player => ({
        'Dancer': player.name,
        'Round 1': player.round1,
        'Round 2': player.round2,
        'Final Score': player.final
    })));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Scores');
    xlsx.writeFile(workbook, 'scoreboard.xlsx');
};

// Load initial data from the Excel file when the server starts
loadExcelData();

// API route to get current scores
app.get('/api/scores', (req, res) => {
    res.json(players);
});

// API route to add a new player
app.post('/api/players', (req, res) => {
    const { name } = req.body;
    const newPlayer = {
        name,
        round1: 0,
        round2: 0,
        final: 0
    };
    players.push(newPlayer);
    saveToExcel();
    res.status(201).json(newPlayer);
});

// API route to update scores
app.put('/api/scores', (req, res) => {
    const { playerIndex, round, score } = req.body;
    if (round === 1) {
        players[playerIndex].round1 = score;
    } else if (round === 2) {
        players[playerIndex].round2 = score;
    }
    players[playerIndex].final = (players[playerIndex].round1 + players[playerIndex].round2); // Example calculation
    saveToExcel();
    res.status(200).send('Score updated');
});

// API route to remove a player
app.delete('/api/players/:index', (req, res) => {
    const index = req.params.index;
    players.splice(index, 1);
    saveToExcel();
    res.status(204).send();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
