import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const DailyView = () => {
  const [dailyVolunteers, setDailyVolunteers] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  const fetchDailyData = async () => {
    try {
      console.log('Fetching data for date:', selectedDate);
      
      // Fetch daily volunteers
      const volunteersResponse = await fetch(
        `http://localhost:5000/daily?date=${selectedDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors'
        }
      );
      const volunteersData = await volunteersResponse.json();
      console.log('Volunteers response:', volunteersData);

      // Fetch daily stats
      const statsResponse = await fetch(
        `http://localhost:5000/daily/stats?date=${selectedDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors'
        }
      );
      const statsData = await statsResponse.json();
      console.log('Stats response:', statsData);

      setDailyVolunteers(volunteersData.volunteers || []);
      setStats(statsData);
      setError('');
    } catch (err) {
      console.error('Error fetching daily data:', err);
      setError('Failed to fetch daily volunteer data');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString();
  };

  const formatDuration = (hours) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="page-container">
      <div className="daily-view">
        <div className="daily-header">
          <h1>Daily Volunteer Report</h1>
          <div className="date-selector">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="header-links">
            <Link to="/daily/add" className="nav-link">Add Hours</Link>
            <Link to="/check-in" className="nav-link">Back to Check-In</Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {stats && (
          <div className="daily-stats">
            <div className="stat-card">
              <h3>Total Volunteers</h3>
              <p>{stats.total_volunteers}</p>
            </div>
            <div className="stat-card">
              <h3>Total Hours</h3>
              <p>{stats.total_hours}</p>
            </div>
            <div className="stat-card">
              <h3>Currently Active</h3>
              <p>{stats.currently_active}</p>
            </div>
          </div>
        )}

        <div className="daily-volunteers">
          <h2>Volunteer Activity</h2>
          {dailyVolunteers.length > 0 ? (
            <div className="volunteers-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyVolunteers.map((volunteer, index) => (
                    <tr key={index} className={volunteer.status === 'checked_in' ? 'active' : ''}>
                      <td>{volunteer.name}</td>
                      <td>{volunteer.email}</td>
                      <td>{formatTime(volunteer.check_in)}</td>
                      <td>{formatTime(volunteer.check_out)}</td>
                      <td>{formatDuration(volunteer.hours)}</td>
                      <td>{volunteer.status === 'checked_in' ? 'Active' : 'Checked Out'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No volunteer activity recorded for this date</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyView; 