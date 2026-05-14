const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Constants
const ORGANIZATION = 'ni';
const PROJECT = 'DevCentral';
const API_VERSION = '7.1';
const BASE_URL = `https://dev.azure.com/${ORGANIZATION}/${PROJECT}/_apis`;

// Helper function to create Basic Auth header
function getBasicAuthHeader(pat) {
  const auth = Buffer.from(`:${pat}`).toString('base64');
  return `Basic ${auth}`;
}

// API endpoint to search tickets
app.post('/api/search', async (req, res) => {
  try {
    const { pat, keyword } = req.body;

    // Validate inputs
    if (!pat || !keyword) {
      return res.status(400).json({ error: 'PAT and keyword are required' });
    }

    const authHeader = getBasicAuthHeader(pat);

    // Step 1: Execute WIQL query to get work item IDs
    const wiqlQuery = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${PROJECT}' AND [System.Title] CONTAINS '${keyword}' AND [System.State] <> 'Closed' ORDER BY [System.ChangedDate] DESC`;

    let workItemIds = [];
    try {
      const wiqlResponse = await axios.post(
        `${BASE_URL}/wit/wiql?api-version=${API_VERSION}`,
        { query: wiqlQuery },
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      const wiqlItems = wiqlResponse.data.workItems || [];
      workItemIds = wiqlItems.map((item) => item.id);
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({ error: 'Invalid PAT' });
      }
      if (error.response?.data?.message) {
        return res.status(500).json({ error: 'Azure API error', details: error.response.data.message });
      }
      throw error;
    }

    // If no tickets found
    if (workItemIds.length === 0) {
      return res.json({ tickets: [], message: 'No tickets found' });
    }

    // Limit to top 50 results
    const limitedIds = workItemIds.slice(0, 50).join(',');

    // Step 2: Get detailed work item information
    let tickets = [];
    try {
      const detailsResponse = await axios.get(
        `${BASE_URL}/wit/workitems?ids=${limitedIds}&api-version=${API_VERSION}`,
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );

      tickets = detailsResponse.data.value.map((item) => ({
        id: item.id,
        title: item.fields['System.Title'] || 'N/A',
        state: item.fields['System.State'] || 'N/A',
        assignedTo: item.fields['System.AssignedTo']?.displayName || 'Unassigned',
        changedDate: new Date(
          item.fields['System.ChangedDate']
        ).toLocaleDateString(),
        link: `https://dev.azure.com/${ORGANIZATION}/${PROJECT}/_workitems/edit/${item.id}`,
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({ error: 'Invalid PAT' });
      }
      if (error.response?.data?.message) {
        return res.status(500).json({ error: 'Azure API error', details: error.response.data.message });
      }
      throw error;
    }

    res.json({ tickets, count: tickets.length });
  } catch (error) {
    console.error('Error:', error.message);
    res
      .status(500)
      .json({ error: 'Server error', details: error.message });
  }
});

// Copilot Studio-friendly endpoint (simplified)
app.post('/api/search-tickets', async (req, res) => {
  try {
    const { pat, keyword, filter_state, filter_assigned_to } = req.body;

    if (!pat || !keyword) {
      return res.status(400).json({ 
        success: false,
        error: 'pat and keyword parameters are required' 
      });
    }

    const authHeader = getBasicAuthHeader(pat);

    // Build WIQL query with optional filters
    let wiqlQuery = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${PROJECT}' AND [System.Title] CONTAINS '${keyword}' AND [System.State] <> 'Closed'`;
    
    if (filter_state && filter_state !== 'All') {
      wiqlQuery += ` AND [System.State] = '${filter_state}'`;
    }

    wiqlQuery += ` ORDER BY [System.ChangedDate] DESC`;

    let workItemIds = [];
    try {
      const wiqlResponse = await axios.post(
        `${BASE_URL}/wit/wiql?api-version=${API_VERSION}`,
        { query: wiqlQuery },
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      const wiqlItems = wiqlResponse.data.workItems || [];
      workItemIds = wiqlItems.map((item) => item.id);
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid PAT - Authentication failed' 
        });
      }
      throw error;
    }

    if (workItemIds.length === 0) {
      return res.json({ 
        success: true,
        tickets: [], 
        count: 0,
        message: 'No tickets found' 
      });
    }

    const limitedIds = workItemIds.slice(0, 50).join(',');

    let tickets = [];
    try {
      const detailsResponse = await axios.get(
        `${BASE_URL}/wit/workitems?ids=${limitedIds}&api-version=${API_VERSION}`,
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );

      tickets = detailsResponse.data.value
        .map((item) => ({
          id: item.id,
          title: item.fields['System.Title'] || 'N/A',
          state: item.fields['System.State'] || 'N/A',
          assignedTo: item.fields['System.AssignedTo']?.displayName || 'Unassigned',
          changedDate: new Date(
            item.fields['System.ChangedDate']
          ).toLocaleDateString(),
          link: `https://dev.azure.com/${ORGANIZATION}/${PROJECT}/_workitems/edit/${item.id}`,
        }))
        .filter((ticket) => {
          if (filter_assigned_to && filter_assigned_to !== 'All') {
            return ticket.assignedTo === filter_assigned_to;
          }
          return true;
        });
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid PAT - Authentication failed' 
        });
      }
      throw error;
    }

    res.json({ 
      success: true,
      tickets, 
      count: tickets.length 
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error', 
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend build assets when available
const frontendDist = path.join(__dirname, 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
