const express = require('express');
const axios = require('axios');
const app = express();
const port = 9876;

app.use(express.json());

// Configs
const windowSize = 10;
let window = [];
const baseUrl = 'http://20.244.56.144/evaluation-service';
let authToken = null; 

// Map numberId to endpoint paths
const endpointMap = {
  'p': 'primes',
  'f': 'fibonacci',
  'e': 'even',
  'r': 'random'
};

// Fetch authorization token
async function getAuthToken() {
  if (authToken) return authToken;
  authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJkaGl2YWthcnIwN0BnbWFpbC5jb20iLCJleHAiOjE3NTA0ODI3NTksImlhdCI6MTc1MDQ4MjQ1OSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImZlNTQ4ZjNhLWY0YzEtNGQ2YS05NmViLWMzNGM0ZjIwMzY5YSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImRoaXZha2FyIHIiLCJzdWIiOiJhZWZlYTZlNC1kMjM2LTRhOGUtYTg3Yy1lM2Y2NWI4NGNhNWUifSwiZW1haWwiOiJkaGl2YWthcnIwN0BnbWFpbC5jb20iLCJuYW1lIjoiZGhpdmFrYXIgciIsInJvbGxObyI6IjI0bWNhMDA5IiwiYWNjZXNzQ29kZSI6IldjVFNLdiIsImNsaWVudElEIjoiYWVmZWE2ZTQtZDIzNi00YThlLWE4N2MtZTNmNjViODRjYTVlIiwiY2xpZW50U2VjcmV0IjoieW11dlRXUll5U3pmYWdSViJ9.r9zojogPQUsiI4rzYLOgZNhaz0eIBaZ5HrzGuP_0VKM';
  return authToken;
}

// Fetch numbers from test server with timeout and authentication
async function fetchNumbers(numberId) {
  try {
    const token = await getAuthToken();
    console.log(`Fetching ${numberId} with token: ${token.substring(0, 10)}...`);
    const path = endpointMap[numberId] || numberId; // Use mapped path or fallback to numberId
    const response = await axios.get(`${baseUrl}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 500 // 500ms timeout
    });
    console.log(`Fetched ${numberId}:`, response.data.numbers);
    return response.data.numbers || [];
  } catch (error) {
    console.error(`Error fetching ${numberId}:`, error.message, error.response?.status);
    return [];
  }
}

// Calculate average
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return parseFloat(sum / numbers.length).toFixed(2);
}

// API endpoint
app.get('/numbers/:numberId', async (req, res) => {
  const { numberId } = req.params;
  const validIds = ['p', 'f', 'e', 'r'];
  if (!validIds.includes(numberId)) {
    return res.status(400).json({ error: 'Invalid numberId' });
  }

  const startTime = Date.now();
  const newNumbers = await fetchNumbers(numberId);

  if (newNumbers.length === 0 || Date.now() - startTime > 500) {
    return res.status(200).json({
      windowPrevState: [...window],
      numbers: [],
      avg: calculateAverage(window)
    });
  }

  // Update window
  const updatedWindow = [...window, ...newNumbers].slice(-windowSize);
  window = updatedWindow;

  const response = {
    windowPrevState: window.length > newNumbers.length ? window.slice(0, -newNumbers.length) : [],
    numbers: newNumbers,
    avg: calculateAverage(window)
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
