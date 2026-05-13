import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [savedPat, setSavedPat] = useState('');
  const [patTab, setPatTab] = useState('saved');
  const [newPat, setNewPat] = useState('');
  const [keyword, setKeyword] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filterState, setFilterState] = useState('All');
  const [filterAssignedTo, setFilterAssignedTo] = useState('All');
  const [titleSearch, setTitleSearch] = useState('');

  useEffect(() => {
    const storedPat = localStorage.getItem('azureDevOpsPat') || '';
    if (storedPat) {
      setSavedPat(storedPat);
      setPatTab('saved');
    } else {
      setPatTab('new');
    }
  }, []);

  const activePat = patTab === 'saved' ? savedPat : newPat;

  const handleSavePat = () => {
    if (!newPat.trim()) {
      setError('Enter a PAT before saving');
      return;
    }
    localStorage.setItem('azureDevOpsPat', newPat.trim());
    setSavedPat(newPat.trim());
    setPatTab('saved');
    setError('');
    setMessage('PAT saved locally for future searches.');
  };

  const handleClearPat = () => {
    localStorage.removeItem('azureDevOpsPat');
    setSavedPat('');
    setPatTab('new');
    setMessage('Saved PAT cleared. Enter a PAT to continue.');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setTickets([]);

    if (!activePat?.trim()) {
      setError('Personal Access Token is required');
      return;
    }

    if (!keyword.trim()) {
      setError('Project number or keyword is required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/search', {
        pat: activePat.trim(),
        keyword: keyword.trim(),
      });

      if (response.data.tickets.length === 0) {
        setMessage('No tickets found');
        setTickets([]);
      } else {
        setTickets(response.data.tickets);
        setMessage(`Found ${response.data.count} ticket(s)`);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid PAT - Authentication failed');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || 'An error occurred while searching tickets');
      }
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (link) => {
    window.open(link, '_blank');
  };

  const visibleTickets = tickets.filter((ticket) => {
    const matchesState = filterState === 'All' || ticket.state === filterState;
    const matchesAssigned =
      filterAssignedTo === 'All' || ticket.assignedTo === filterAssignedTo;
    const matchesTitle =
      titleSearch.trim() === '' ||
      ticket.title.toLowerCase().includes(titleSearch.trim().toLowerCase());
    return matchesState && matchesAssigned && matchesTitle;
  });

  const availableStates = [
    'All',
    ...Array.from(new Set(tickets.map((ticket) => ticket.state))).sort(),
  ];
  const availableAssignees = [
    'All',
    ...Array.from(new Set(tickets.map((ticket) => ticket.assignedTo))).sort(),
  ];

  return (
    <div className="container">
      <div className="app-wrapper">
        <header className="header">
          <h1>🔍 Azure DevOps Ticket Search</h1>
          <p>Search tickets in DevCentral project</p>
        </header>

        <form onSubmit={handleSearch} className="search-form">
          <div className="pat-tabs">
            <button
              type="button"
              className={`tab-button ${patTab === 'saved' ? 'active' : ''}`}
              onClick={() => setPatTab('saved')}
              disabled={loading}
            >
              Saved PAT
            </button>
            <button
              type="button"
              className={`tab-button ${patTab === 'new' ? 'active' : ''}`}
              onClick={() => setPatTab('new')}
              disabled={loading}
            >
              New PAT
            </button>
          </div>

          {patTab === 'saved' ? (
            <div className="form-group pat-group">
              <label>Use saved PAT</label>
              <div className="saved-pat-row">
                <input
                  type="password"
                  value={savedPat ? '••••••••••••••••••••' : ''}
                  placeholder={savedPat ? 'Saved PAT loaded' : 'No saved PAT yet'}
                  disabled
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleClearPat}
                  disabled={!savedPat || loading}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="form-group pat-group">
              <label htmlFor="new-pat">Personal Access Token (PAT)</label>
              <input
                id="new-pat"
                type="password"
                value={newPat}
                onChange={(e) => setNewPat(e.target.value)}
                placeholder="Enter and save your Azure DevOps PAT"
                disabled={loading}
                autoComplete="off"
              />
              <button
                type="button"
                className="save-pat-btn"
                onClick={handleSavePat}
                disabled={loading}
              >
                Save PAT
              </button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="keyword">Project Number or Search Keyword</label>
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., 9315 or title keyword"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="search-btn">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Searching Azure DevOps...</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {message && tickets.length > 0 && (
          <div className="success-message">{message}</div>
        )}

        {message && tickets.length === 0 && (
          <div className="info-message">{message}</div>
        )}

        {tickets.length > 0 && (
          <div className="results-section">
            <div className="filter-panel">
              <div>
                <label htmlFor="state-filter">Filter by State</label>
                <select
                  id="state-filter"
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                >
                  {availableStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assigned-filter">Filter by Assigned To</label>
                <select
                  id="assigned-filter"
                  value={filterAssignedTo}
                  onChange={(e) => setFilterAssignedTo(e.target.value)}
                >
                  {availableAssignees.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="search-title-group">
                <label htmlFor="title-filter">Search by Title</label>
                <input
                  id="title-filter"
                  type="text"
                  value={titleSearch}
                  onChange={(e) => setTitleSearch(e.target.value)}
                  placeholder="Filter visible results by title"
                />
              </div>
            </div>

            <h2>Search Results</h2>
            <p className="results-count">
              Showing {visibleTickets.length} of {tickets.length} ticket(s)
            </p>
            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>State</th>
                    <th>Assigned To</th>
                    <th>Changed Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`state-${ticket.state.toLowerCase()}`}
                    >
                      <td className="id-cell">{ticket.id}</td>
                      <td className="title-cell">{ticket.title}</td>
                      <td>
                        <span
                          className={`state-badge state-${ticket.state.toLowerCase()}`}
                        >
                          {ticket.state}
                        </span>
                      </td>
                      <td>{ticket.assignedTo}</td>
                      <td>{ticket.changedDate}</td>
                      <td>
                        <button
                          onClick={() => handleOpenLink(ticket.link)}
                          className="link-btn"
                          title="Open in Azure DevOps"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>
          Azure DevOps Organization: <strong>ni</strong> | Project:{' '}
          <strong>DevCentral</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
