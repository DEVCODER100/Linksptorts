import React, { useState } from 'react';

const mockEvents = [
  { id: 1, title: 'National Football Championship', org: 'Delhi FC Academy', sport: 'Football', type: 'tournament', date: 'Apr 15, 2026', city: 'New Delhi', registrations: 48, status: 'approved', fee: '₹500' },
  { id: 2, title: 'Mumbai Cricket Trials S8', org: 'Mumbai Sports Club', sport: 'Cricket', type: 'trial', date: 'Apr 22, 2026', city: 'Mumbai', registrations: 120, status: 'pending', fee: 'Free' },
  { id: 3, title: 'South Zone Basketball Cup', org: 'SAI Bangalore', sport: 'Basketball', type: 'tournament', date: 'May 1, 2026', city: 'Bangalore', registrations: 24, status: 'approved', fee: '₹300' },
  { id: 4, title: 'TN Tennis Camp', org: 'Chennai Tennis Assoc.', sport: 'Tennis', type: 'camp', date: 'May 10, 2026', city: 'Chennai', registrations: 15, status: 'pending', fee: '₹2,000' },
];

const mockJobs = [
  { id: 1, title: 'Head Football Coach', org: 'Delhi FC Academy', sport: 'Football', city: 'New Delhi', applications: 12, salary: '₹40K-60K/mo', status: 'approved' },
  { id: 2, title: 'Cricket Batting Coach', org: 'Mumbai Sports Club', sport: 'Cricket', city: 'Mumbai', applications: 8, salary: '₹35K-50K/mo', status: 'pending' },
  { id: 3, title: 'Swimming Instructor', org: 'SAI Bangalore', sport: 'Swimming', city: 'Bangalore', applications: 5, salary: '₹30K-45K/mo', status: 'approved' },
];

export default function EventsPage() {
  const [tab, setTab] = useState('events');

  return (
    <>
      <div className="tabs">
        <button className={`tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>
          Events & Tournaments ({mockEvents.length})
        </button>
        <button className={`tab ${tab === 'jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>
          Coaching Jobs ({mockJobs.length})
        </button>
      </div>

      {tab === 'events' && (
        <div className="table-container">
          <div className="table-header">
            <h3>All Events</h3>
            <div className="table-actions">
              <select style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}>
                <option>All Types</option>
                <option>Tournament</option>
                <option>Trial</option>
                <option>Camp</option>
              </select>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Sport</th>
                <th>City</th>
                <th>Date</th>
                <th>Fee</th>
                <th>Registrations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockEvents.map(event => (
                <tr key={event.id}>
                  <td>
                    <div className="user-info">
                      <strong>{event.title}</strong>
                      <span>by {event.org}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${event.type === 'tournament' ? 'player' : event.type === 'trial' ? 'coach' : 'organization'}`}>{event.type}</span></td>
                  <td style={{ fontSize: 13 }}>{event.sport}</td>
                  <td style={{ fontSize: 13 }}>{event.city}</td>
                  <td style={{ fontSize: 13 }}>{event.date}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{event.fee}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{event.registrations}</td>
                  <td>
                    <span className={`badge ${event.status === 'approved' ? 'active' : 'pending'}`}>{event.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {event.status === 'pending' && <button className="btn btn-primary btn-sm">Approve</button>}
                      <button className="btn btn-outline btn-sm">View</button>
                      <button className="btn btn-outline btn-sm" style={{ color: 'var(--error)' }}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'jobs' && (
        <div className="table-container">
          <div className="table-header">
            <h3>All Coaching Jobs</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Organization</th>
                <th>Sport</th>
                <th>City</th>
                <th>Salary</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockJobs.map(job => (
                <tr key={job.id}>
                  <td><strong style={{ fontSize: 14 }}>{job.title}</strong></td>
                  <td style={{ fontSize: 13 }}>{job.org}</td>
                  <td style={{ fontSize: 13 }}>{job.sport}</td>
                  <td style={{ fontSize: 13 }}>{job.city}</td>
                  <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{job.salary}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{job.applications}</td>
                  <td>
                    <span className={`badge ${job.status === 'approved' ? 'active' : 'pending'}`}>{job.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {job.status === 'pending' && <button className="btn btn-primary btn-sm">Approve</button>}
                      <button className="btn btn-outline btn-sm">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
