import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Solar Assistant. Ask me anything about solar energy, savings, or installation!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/chat', {
        message: userMessage,
        history: []
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + res.data.error }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#8e44ad', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>💬 Solar Assistant</h1>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>← Back to Dashboard</Link>
      </div>
      <div style={{ flex: 1, padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', height: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '15px' }}>
                <div style={{
                  maxWidth: '70%', padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #8e44ad, #9b59b6)' : '#f0f0f0',
                  color: msg.role === 'user' ? 'white' : '#333',
                  fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                <div style={{ background: '#f0f0f0', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', color: '#888' }}>
                  🤔 Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Ask about solar energy..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }}
            />
            <button onClick={sendMessage} disabled={loading}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #8e44ad, #9b59b6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;