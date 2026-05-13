# Azure DevOps Ticket Search

A complete local web application for searching Azure DevOps tickets using a project keyword. Built with React frontend and Node.js/Express backend.

## 🎯 Features

- **Save PAT Locally** - Store your Personal Access Token using browser localStorage so you don't need to re-enter it
- **PAT Tabs** - Switch between saved PAT and new PAT options
- **Search by Keyword** - Find tickets containing a specific keyword in the title
- **Advanced Filtering** - Filter results by state, assigned team member, and title search
- **Secure Authentication** - Uses Personal Access Token (PAT) with Basic Auth
- **Beautiful Results Table** - Display ticket ID, title, state, assigned user, and change date
- **Direct Azure DevOps Links** - Click to open tickets directly in Azure DevOps
- **Error Handling** - Clear error messages for invalid PAT or API issues
- **Responsive Design** - Works on desktop and mobile devices
- **Loading Spinner** - Visual feedback during search operations
- **Result Limit** - Returns up to 50 most recent tickets
- **REST API Ready** - Copilot Studio integration available via `/api/search-tickets`

## 📋 Requirements

- Node.js (v14 or higher)
- npm or yarn
- Azure DevOps Personal Access Token (PAT)

## 🚀 Quick Start

### 1. Clone or Extract the Project

```bash
cd azure-devops-ticket-search
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
cd ..
```

### 4. Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm start
```

The backend will start on `http://localhost:5000`

### 5. Start the Frontend Development Server

Open another terminal and run:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### 6. Open in Browser

Navigate to `http://localhost:3000` in your browser

## 📖 Usage

1. **Get your PAT**: 
   - Go to https://dev.azure.com
   - Click on your profile icon → Personal access tokens
   - Create a new token with "Read & execute" permissions for Work Items
   - Copy the token

2. **Search for Tickets**:
   - Paste your PAT in the "Personal Access Token" field
   - Enter a project keyword (e.g., "9315")
   - Click "Search"
   - View results in the table
   - Click "Open" to view tickets in Azure DevOps

## 🔐 Security

- **PAT is NOT stored**: Your Personal Access Token is only used in memory for the API request
- **PAT is NOT logged**: No logging of sensitive authentication data
- **Basic Auth**: Credentials are sent via HTTPS in production (use HTTPS in production!)
- **CORS enabled**: Frontend can communicate with backend securely

## 🛠️ API Endpoints

### POST /api/search

**Request**:
```json
{
  "pat": "your_personal_access_token",
  "keyword": "9315"
}
```

**Response** (Success):
```json
{
  "tickets": [
    {
      "id": 12345,
      "title": "Feature: 9315 - New functionality",
      "state": "Active",
      "assignedTo": "John Doe",
      "changedDate": "5/13/2026",
      "link": "https://dev.azure.com/ni/DevCentral/_workitems/edit/12345"
    }
  ],
  "count": 1
}
```

**Response** (No tickets found):
```json
{
  "tickets": [],
  "message": "No tickets found"
}
```

**Response** (Invalid PAT):
```json
{
  "error": "Invalid PAT"
}
```

## 📦 Project Structure

```
azure-devops-ticket-search/
├── backend/
│   ├── server.js           # Express server
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables example
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React app component
│   │   ├── App.css         # Styling
│   │   └── index.jsx       # React entry point
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
└── README.md
```

## 🔄 How It Works

### Backend Flow

1. Receives PAT and keyword from frontend
2. Calls Azure DevOps WIQL API with the search query
3. Extracts work item IDs from the response
4. Calls Azure DevOps work items API to get detailed information
5. Formats and returns the results to frontend

### WIQL Query

```
SELECT [System.Id] FROM WorkItems 
WHERE [System.TeamProject] = 'DevCentral' 
AND [System.Title] CONTAINS 'keyword' 
AND [System.State] <> 'Closed' 
ORDER BY [System.ChangedDate] DESC
```

## ⚠️ Troubleshooting

### "Invalid PAT" Error
- Ensure your PAT is valid and not expired
- Check that the token has "Read & execute" permissions for Work Items

### "No tickets found"
- Verify the keyword exists in the title of tickets
- Check that tickets are not in "Closed" state
- Only non-closed tickets are returned

### Backend not responding
- Ensure backend is running on port 5000
- Check that all dependencies are installed (`npm install` in backend folder)
- Look for error messages in the backend terminal

### Frontend can't connect to backend
- Ensure both frontend and backend are running
- Check that proxy is correctly configured in `vite.config.js`
- Verify ports: Backend (5000) and Frontend (3000)

## 🎨 Customization

### Change Organization or Project
Edit `/backend/server.js`:
```javascript
const ORGANIZATION = 'your-org';
const PROJECT = 'your-project';
```

### Change Port
Set in `/backend/.env`:
```
PORT=8000
```

Or in frontend, update `/frontend/vite.config.js`

### Customize Styling
Edit `/frontend/src/App.css` for colors, fonts, and layouts

## 📝 Notes

- Results are limited to 50 tickets
- Only non-closed tickets are returned
- Results are sorted by most recently changed
- The app works with Azure DevOps organization "ni" and project "DevCentral"

## 🤝 Support

For issues or questions about Azure DevOps API:
- [Azure DevOps REST API Documentation](https://learn.microsoft.com/en-us/rest/api/azure/devops)
- [WIQL Query Language](https://learn.microsoft.com/en-us/azure/devops/boards/queries/wiql/wiql-syntax)

## 📄 License

ISC
>>>>>>> 12ea054 (Initial commit: Azure DevOps ticket search application with PAT storage and result filters)
