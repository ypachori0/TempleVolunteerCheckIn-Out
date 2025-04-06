import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../components/VolunteerForm.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/volunteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register');
      }

      await response.json();
      setFormData({ name: '', email: '' });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="page-container">
      <div className="volunteer-form">
        <h2>Register as New Volunteer</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">Registration successful! You can now check in for volunteer work.</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">Register</button>
        </form>
        <div className="nav-links">
          <Link to="/check-in">Already registered? Check in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register; 