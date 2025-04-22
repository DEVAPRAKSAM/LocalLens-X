// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import Footer from './components/Footer';
import 'leaflet/dist/leaflet.css';

function LocationMarker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}

function ReportPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    location: null,
  });

  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('http://localhost:8000/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Error fetching complaints', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleLocationSelect = (latlng) => {
    setFormData({ ...formData, location: latlng });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.image) {
      alert('Please select a location and upload an image!');
      return;
    }

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('image', formData.image);
    payload.append('lat', formData.location.lat);
    payload.append('lng', formData.location.lng);

    try {
      await axios.post('http://localhost:8000/report', payload);
      alert('Complaint submitted successfully! 🎉');
      fetchComplaints();
      setFormData({ title: '', description: '', image: null, location: null });
    } catch (err) {
      console.error(err);
      alert('Failed to submit complaint');
    }
  };

  const deleteComplaint = async (index) => {
    try {
      const updated = [...complaints];
      updated.splice(index, 1);
      setComplaints(updated);
      alert('Deleted locally (you can later add DB delete)');
    } catch (err) {
      console.error('Error deleting complaint:', err);
      alert('Failed to delete complaint');
    }
  };

  const downloadPDF = async (complaint) => {
    try {
      const res = await axios.post(
        'http://localhost:8000/generate_pdf',
        {
          title: complaint.title,
          description: complaint.description,
          location: {
            lat: complaint.lat,
            lng: complaint.lng,
          },
          ai_caption: complaint.ai_caption,
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'LocalLensX_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF');
      console.error(err);
    }
    console.log("Home:", Home);
    console.log("NotFound:", NotFound);
    console.log("Header:", Header);
    console.log("Footer:", Footer);

  };

  return (
    <div className="App">
      <h1>📍 LocalLens X</h1>

      <form onSubmit={handleSubmit} className="complaint-form">
        <input
          type="text"
          name="title"
          placeholder="Issue Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          required
        />
        <button type="submit">Submit Complaint</button>
      </form>

      <h3>🗺️ Select Location on Map</h3>
      <MapContainer
        center={[11.341, 77.717]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker onLocationSelect={handleLocationSelect} />
      </MapContainer>

      <h2>📋 Submitted Complaints</h2>
      {complaints.map((comp, index) => (
        <div key={index} className="complaint-card">
          <h4>{comp.title}</h4>
          <p>{comp.description}</p>
          <p>
            <strong>Location:</strong> {comp.lat}, {comp.lng}
          </p>
          <p>
            <strong>AI Caption:</strong> {comp.ai_caption}
          </p>
          <img
            src={`http://localhost:8000/uploads/${comp.image}`}
            alt="issue"
            style={{ width: '200px' }}
          />
          <br />
          <button onClick={() => downloadPDF(comp)}>Download PDF</button>
          <button
            onClick={() => deleteComplaint(index)}
            style={{ marginLeft: '10px' }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
