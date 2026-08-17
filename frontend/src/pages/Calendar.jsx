import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const { showToast } = useToast();

  const loadEvents = () => {
    api.get('/calendar').then(res => setEvents(res.data.events));
  };

  useEffect(() => { loadEvents(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/calendar', { title, eventDate, notes });
    setTitle(''); setEventDate(''); setNotes('');
    loadEvents();
    showToast('Event added.');
  };

  const handleDelete = async (id) => {
    await api.delete(`/calendar/${id}`);
    loadEvents();
     showToast('Event deleted.')
  };

  return (
    <div>
      <h1 className="page-title">Calendar</h1>
      <form onSubmit={handleAdd} className="form-card wide" style={{marginBottom: '24px'}}>
        <label>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required />
        <label>Date</label>
        <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
        <label>Notes (optional)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} />
        <button type="submit" className="btn-primary">Add event</button>
      </form>

      {events.length === 0 ? (
        <p className="empty-state">No upcoming events. Add one above.</p>
      ) : (
        events.map(ev => (
          <div key={ev.id} className="event-card">
            <span className="event-date-badge">{ev.event_date}</span>
            <div className="event-info">
              <div className="event-title">{ev.title}</div>
              {ev.notes && <div className="event-notes">{ev.notes}</div>}
            </div>
            <button className="btn-danger" onClick={() => handleDelete(ev.id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
}