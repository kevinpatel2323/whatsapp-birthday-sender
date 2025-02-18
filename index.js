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

// Function to fetch users with today's birthday and haven't been wished
const fetchEligibleUsers = async () => {
  try {
    // Get today's date in IST (MM-DD format)
    const now = new Date();
    const utcOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + utcOffset);

    const istMonth = (istDate.getMonth() + 1).toString().padStart(2, '0');
    const istDay = istDate.getDate().toString().padStart(2, '0');

    // Generate possible full YYYY-MM-DD dates (covering past 100 years)
    const currentYear = new Date().getFullYear();
    let possibleBirthDates = [];
    
    for (let year = currentYear - 100; year <= currentYear; year++) {
      possibleBirthDates.push(`${year}-${istMonth}-${istDay},00:00:00`);
    }


    let allDocuments = [];
    let lastDocumentId = null;
    let hasMore = true;

    while (hasMore) {
      let query = [
        Query.limit(100), // Fetch max 100 at a time
        Query.equal('birthday_whished', false), // Only users who haven't been wished
        Query.equal('birth_date', possibleBirthDates), // Match any valid YYYY-MM-DD
      ];

      // If there's a last document, paginate
      if (lastDocumentId) {
        query.push(Query.cursorAfter(lastDocumentId));
      }

      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, query);
      allDocuments = [...allDocuments, ...response.documents];

      if (response.documents.length < 100) {
        hasMore = false;
      } else {
        lastDocumentId = response.documents[response.documents.length - 1].$id;
      }
    }

    return allDocuments;
  } catch (err) {
    console.error('❌ Error fetching eligible users:', err);
    throw err;
  }
};

// Endpoint to fetch all users with birthdays today
app.get('/users', async (req, res) => {
  try {
    const users = await fetchEligibleUsers();
    res.status(200).send({ total: users.length, documents: users });
  } catch (err) {
    res.status(500).send({ message: 'Failed to fetch users', error: err.message });
  }
});

// Endpoint to mark a user as wished
app.get('/update-users/:id', async (req, res) => {
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, req.params.id, { birthday_whished: true });
    res.status(200).send({ message: 'User updated successfully' });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).send({ message: 'Failed to update user', error: err.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));
