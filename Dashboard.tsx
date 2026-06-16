import { useState, useEffect } from 'react';

// Define the shape of the repository activity events
interface GitHubEvent {
    EventID: string;
    Pusher: string;
    Branch: string;
    Message: string;
    Timestamp: string;
    Repository?: string; // Track which repository was updated
}

export default function Dashboard() {
    const [events, setEvents] = useState<GitHubEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const API_URL = 'https://kfzmygxx0c.execute-api.ap-southeast-2.amazonaws.com/activity';

    const fetchData = (isUpdate = false) => {
        if (isUpdate) {
            setUpdating(true);
        } else {
            setLoading(true);
        }
        setError(null);

        fetch(API_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                // Sort the data so the newest commits are at the top
                const sortedData = data.sort((a: GitHubEvent, b: GitHubEvent) =>
                    new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
                );
                setEvents(sortedData);
                setLastUpdated(new Date());
                setLoading(false);
                setUpdating(false);
            })
            .catch((err) => {
                console.error('Error fetching data:', err);
                setError('Failed to fetch repository activity. Please verify your connection or API Gateway status.');
                setLoading(false);
                setUpdating(false);
            });
    };

    useEffect(() => {
        fetchData();
        // Set up automatic refresh every 60 seconds
        const interval = setInterval(() => {
            fetchData(true);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter events based on search query
    const filteredEvents = events.filter((event) => {
        const query = searchQuery.toLowerCase();
        return (
            event.Pusher.toLowerCase().includes(query) ||
            event.Branch.toLowerCase().includes(query) ||
            event.Message.toLowerCase().includes(query) ||
            (event.Repository && event.Repository.toLowerCase().includes(query))
        );
    });

    // Calculate metrics
    const totalCommits = events.length;
    const uniqueContributors = new Set(events.map((e) => e.Pusher)).size;
    const uniqueBranches = new Set(events.map((e) => e.Branch)).size;
    const uniqueRepos = new Set(events.map((e) => e.Repository || 'Unknown')).size;

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ')[0].substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner"></div>
                <h2 style={{ marginTop: '16px', fontWeight: 600 }}>Loading repository activity...</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Connecting to AWS Serverless API Gateway...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="title-section">
                    <h1>Serverless Data Tracker</h1>
                    <p>
                        Real-time GitHub activity fetched via AWS Lambda and API Gateway
                    </p>
                </div>
                <div className="controls-section">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`pulse-indicator ${updating ? 'updating' : ''}`}></span>
                        {updating ? 'Syncing...' : lastUpdated ? `Synced: ${lastUpdated.toLocaleTimeString()}` : ''}
                    </span>
                    <button
                        className="btn-refresh"
                        onClick={() => fetchData(true)}
                        disabled={updating}
                    >
                        {updating ? (
                            <>
                                <div className="spinner-sm"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.314 6H16" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Sync Now
                            </>
                        )}
                    </button>
                </div>
            </header>

            {error && (
                <div className="error-wrapper" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    marginBottom: '24px',
                    textAlign: 'left',
                    color: '#fca5a5'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                            <strong style={{ display: 'block', fontWeight: 600 }}>Connection Error</strong>
                            <span style={{ fontSize: '0.9rem' }}>{error}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <section className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="metric-info">
                        <h3>Total Commits</h3>
                        <div className="metric-value">{totalCommits}</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="metric-info">
                        <h3>Contributors</h3>
                        <div className="metric-value">{uniqueContributors}</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M8 7v12m0 0l-4-4m4 4l4-4m0 6V7m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="metric-info">
                        <h3>Active Branches</h3>
                        <div className="metric-value">{uniqueBranches}</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="metric-info">
                        <h3>Tracked Repos</h3>
                        <div className="metric-value">{uniqueRepos}</div>
                    </div>
                </div>
            </section>

            {/* Table Card container */}
            <div className="table-container">
                <div className="table-header-controls">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Commit History</h2>
                    <div className="search-input-wrapper">
                        <svg className="search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Filter by pusher, branch, msg..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filteredEvents.length === 0 ? (
                    <div className="empty-wrapper">
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                            <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h3 style={{ fontWeight: 600 }}>No matching activity found</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Try adjusting your filter search or checking for new commits.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Repository</th>
                                    <th>Developer</th>
                                    <th>Branch</th>
                                    <th>Commit Message</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvents.map((event) => (
                                    <tr key={event.EventID}>
                                        <td>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: '0.825rem',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                color: '#e2e8f0'
                                            }}>
                                                {event.Repository || 'automated-serverless-data-tracker'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="pusher-cell">
                                                <div className="avatar">
                                                    {getInitials(event.Pusher)}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{event.Pusher}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-branch ${event.Branch.includes('main') || event.Branch.includes('master') ? 'main' : 'feature'}`}>
                                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                                    <path d="M18 18h6v6h-6zM10 4h6v6h-6zM2 12h6v6h-2z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                {event.Branch.replace('refs/heads/', '')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="commit-msg" title={event.Message}>
                                                {event.Message}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="date-text">
                                                {new Date(event.Timestamp).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}