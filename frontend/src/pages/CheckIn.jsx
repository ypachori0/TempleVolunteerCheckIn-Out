import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import '../components/VolunteerForm.css';

const CheckIn = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [formData, setFormData] = useState({
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showHours, setShowHours] = useState(false);
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [currentEmail, setCurrentEmail] = useState('');

  useEffect(() => {
    fetchVolunteers();
    // Refresh volunteer list every minute
    const interval = setInterval(fetchVolunteers, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-close success message after 10 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-close hours after 10 seconds
  useEffect(() => {
    if (showHours) {
      const timer = setTimeout(() => {
        setShowHours(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showHours]);

  const fetchVolunteers = () => {
    fetch("http://localhost:5000/", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Received data:", data);
        setVolunteers(data.volunteers || []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to fetch volunteer data");
        setVolunteers([]);
      });
  };

  const fetchVolunteerHours = (email) => {
    if (!email) return;

    fetch(`http://localhost:5000/hours/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.hours) {
          setVolunteerHours(data.hours);
        } else {
          setVolunteerHours([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching hours:", error);
        setVolunteerHours([]);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowHours(false);

    try {
      const response = await fetch('http://localhost:5000/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: new URLSearchParams({
          username: formData.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      // Get the volunteer's name from the active volunteers list
      const volunteer = volunteers.find(v => v.email === formData.email) || 
                       (data.volunteer ? data.volunteer : { name: 'Volunteer' });

      setSuccess(`${volunteer.name} has ${data.status === 'checked_in' ? 'checked in' : 'checked out'} successfully`);
      
      // Always clear the form
      setFormData({ email: '' });
      
      fetchVolunteers(); // Refresh the volunteer list
      
      if (data.status === 'checked_out') {
        setCurrentEmail(formData.email);
        setShowHours(true);
        fetchVolunteerHours(formData.email);
      }
    } catch (err) {
      setError(err.message);
      console.error('Check in/out error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="page-container">
      <Link to="/daily" className="corner-link">View Daily Report</Link>
      <div className="check-in-container">
        <div className="volunteer-form">
          <h2>Volunteer Check In/Out</h2>
          {error && <div className="error">{error}</div>}
          {success && (
            <div className="success">
              <span>{success}</span>
              <button 
                className="close-button"
                onClick={() => setSuccess('')}
                aria-label="Close message"
              >
                ×
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your registered email"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="action-button">
              Check In/Out
            </button>
          </form>
          <div className="nav-links">
            <Link to="/register">New volunteer? Register here</Link>
          </div>
        </div>

        <div className="content-container">
          <div className="active-volunteers">
            <h2>Currently Active Volunteers</h2>
            {volunteers.length > 0 ? (
              <div className="volunteers-grid">
                {volunteers.map((volunteer, index) => (
                  <div className="volunteer-card" key={index}>
                    <div className="volunteer-info">
                      <span className="name">{volunteer.name}</span>
                      <span className="email">{volunteer.email}</span>
                      <span className="time">Since: {new Date(volunteer.joined_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-volunteers">No volunteers currently checked in</p>
            )}
          </div>
        </div>
      </div>

      {showHours && volunteerHours.length > 0 && (
        <div className="volunteer-hours">
          <div className="hours-header">
            <h2>Recent Hours</h2>
            <button 
              className="close-button"
              onClick={() => setShowHours(false)}
              aria-label="Close hours"
            >
              ×
            </button>
          </div>
          <div className="hours-grid">
            {volunteerHours.slice(0, 5).map((record, index) => (
              <div className="hours-card" key={index}>
                <div className="hours-info">
                  <div className="date">
                    {new Date(record.check_in).toLocaleDateString()}
                  </div>
                  <div className="times">
                    <span>{new Date(record.check_in).toLocaleTimeString()}</span>
                    <span>to</span>
                    <span>{new Date(record.check_out).toLocaleTimeString()}</span>
                  </div>
                  <div className="duration">
                    Duration: {formatDuration(record.hours)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="total-hours">
            Total Hours: {formatDuration(volunteerHours.reduce((sum, record) => sum + record.hours, 0))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn; 