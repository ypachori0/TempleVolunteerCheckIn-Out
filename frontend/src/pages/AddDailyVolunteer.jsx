import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const AddDailyVolunteer = () => {
  const navigate = useNavigate();
  const [registeredVolunteers, setRegisteredVolunteers] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    checkOutDate: new Date().toISOString().split('T')[0],
    checkOutTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRegisteredVolunteers();
  }, []);

  const fetchRegisteredVolunteers = async () => {
    try {
      const response = await fetch('http://localhost:5000/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      const data = await response.json();
      if (data.volunteers) {
        setRegisteredVolunteers(data.volunteers);
      }
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      setError('Failed to fetch registered volunteers');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Combine date and time for check-in and check-out
      const checkIn = new Date(`${formData.checkInDate}T${formData.checkInTime}`).toISOString();
      const checkOut = new Date(`${formData.checkOutDate}T${formData.checkOutTime}`).toISOString();

      // Calculate hours
      const hours = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);

      if (hours < 0) {
        setError('Check-out time must be after check-in time');
        return;
      }

      const volunteer = registeredVolunteers.find(v => v.email === formData.email);
      if (!volunteer) {
        setError('Volunteer not found. Please register the volunteer first.');
        return;
      }

      const response = await fetch('http://localhost:5000/daily/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          name: volunteer.name,
          email: formData.email,
          check_in: checkIn,
          check_out: checkOut,
          hours: hours.toFixed(2),
          status: 'checked_out',
          notes: formData.notes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add volunteer hours');
      }

      setSuccess('Volunteer hours added successfully');
      // Clear form after 2 seconds and redirect to daily view
      setTimeout(() => {
        navigate('/daily');
      }, 2000);
    } catch (err) {
      console.error('Error adding volunteer hours:', err);
      setError(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="add-daily-volunteer">
        <div className="form-header">
          <h1>Add Daily Volunteer Hours</h1>
          <Link to="/daily" className="nav-link">
            Back to Daily View
          </Link>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSubmit} className="add-hours-form">
          <div className="form-group">
            <label htmlFor="email">Volunteer Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              list="volunteer-emails"
              placeholder="Select or type email"
            />
            <datalist id="volunteer-emails">
              {registeredVolunteers.map((volunteer, index) => (
                <option key={index} value={volunteer.email}>
                  {volunteer.name}
                </option>
              ))}
            </datalist>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="checkInDate">Check-in Date:</label>
              <input
                type="date"
                id="checkInDate"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkInTime">Check-in Time:</label>
              <input
                type="time"
                id="checkInTime"
                name="checkInTime"
                value={formData.checkInTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="checkOutDate">Check-out Date:</label>
              <input
                type="date"
                id="checkOutDate"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkOutTime">Check-out Time:</label>
              <input
                type="time"
                id="checkOutTime"
                name="checkOutTime"
                value={formData.checkOutTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes:</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes here"
              rows="3"
            />
          </div>

          <button type="submit" className="submit-button">
            Add Volunteer Hours
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDailyVolunteer; 