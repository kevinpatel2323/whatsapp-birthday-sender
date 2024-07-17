const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection setup
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 19677,
    connectTimeout: 10000
});

console.log('Attempting to connect to MySQL...');

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.get('/users', (req, res) => {
    connection.query('SELECT * FROM users', (error, results) => {
        if (error) {
            return res.status(500).json({ error });
        }
        res.json(results);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/update-birthdates', (req, res) => {
    const query = "UPDATE users SET birthdate = CURDATE()";
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Failed to update birthdates:', error);
            return res.status(500).json({ error: "Failed to update birthdates" });
        }
        res.json({ message: 'Birthdates updated successfully', affectedRows: results.affectedRows });
    });
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
