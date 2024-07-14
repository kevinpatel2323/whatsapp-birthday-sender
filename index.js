const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// MySQL connection setup
const connection = mysql.createConnection({
    host: 'mysql-1b961294-kevinpatelsmsm.i.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_TXCNk41R7UU80GqmXJv',
    database: 'defaultdb'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.get('/users', (req, res) => {
    connection.query('SELECT * FROM users', (error, results) => {
        if (error) {
            return res.status(500).json({ error });
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
