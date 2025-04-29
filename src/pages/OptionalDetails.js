import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // or useHistory if using older react-router

const OptionalDetails = () => {
  const [form, setForm] = useState({
    phone: '',
    social: '',
    location: '',
    occupation: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // TODO: Replace with your API call to update user details
    await fetch('/api/user/optional-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    navigate('/login');
  };

  const handleSkip = () => {
    navigate('/login');
  };

  return (
    <div>
      <h2>Optional Details</h2>
      <p>
        All details are optional. You can update them later in your profile after logging in.
      </p>
      <form onSubmit={handleSave}>
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          type="text"
          name="social"
          placeholder="Social Media (e.g., Twitter handle)"
          value={form.social}
          onChange={handleChange}
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        />
        <input
          type="text"
          name="occupation"
          placeholder="Occupation"
          value={form.occupation}
          onChange={handleChange}
        />
        <button type="submit">Save</button>
        <button type="button" onClick={handleSkip}>Skip</button>
      </form>
    </div>
  );
};

export default OptionalDetails; 