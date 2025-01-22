const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client, Databases, Query } = require('node-appwrite');

const app = express();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const { DATABASE_ID, COLLECTION_ID } = process.env;

// Helper to clean up uploaded files
const cleanUpFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Endpoint to fetch all users with birthdays today
app.get('/users', async (req, res) => {
  try {
    // Get current date in IST
    const now = new Date();
    const utcOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(now.getTime() + utcOffset);

    const istMonth = (istDate.getMonth() + 1).toString().padStart(2, '0'); // Ensure 2 digits
    const istDay = istDate.getDate().toString().padStart(2, '0'); // Ensure 2 digits
    const todayMonthDay = `${istMonth}-${istDay}`; // Format as MM-DD

    // Fetch unwished users
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('birthday_whished', false),
    ]);

    // Filter users with today's birthday (in IST)
    const filteredDocuments = documents.filter((doc) => doc.birth_date.slice(5, 10) === todayMonthDay);

    res.status(200).send({ total: filteredDocuments.length, documents: filteredDocuments });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send({ message: 'Failed to fetch users', error: err.message });
  }
});


// Endpoint to mark a user as wished
app.get('/update-users/:id', async (req, res) => {
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, req.params.id, { birthday_whished: true });
    res.status(200).send({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send({ message: 'Failed to update user', error: err.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname,'public')));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
