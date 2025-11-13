// src/App.js
// SkillSwap Frontend with Plain CSS - UPDATED WITH PROFILE EDITING & CHAT BADGE FIX

import React, { useState, useEffect } from 'react';
import { User, Book, MessageCircle, Shield, LogOut, Send, Check, Search, AlertCircle } from 'lucide-react';
import { authAPI, userAPI, requestAPI, chatAPI, adminAPI } from './services/api';
import './App.css';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [matches, setMatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [lastSeenMessages, setLastSeenMessages] = useState({});
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    name: '', email: '', password: '', 
    offeredSkills: '', desiredSkills: '', bio: ''
  });
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      loadCurrentUser();
    }
    // Load last seen messages from localStorage
    const saved = localStorage.getItem('lastSeenMessages');
    if (saved) {
      setLastSeenMessages(JSON.parse(saved));
    }
  }, []);

  // Auto-refresh chat messages when viewing a chat
  useEffect(() => {
    if (view === 'chats' && selectedChat) {
      // Mark as read when first opening
      markChatAsRead(selectedChat._id);
      
      const interval = setInterval(async () => {
        try {
          const data = await chatAPI.getChat(selectedChat._id);
          setSelectedChat(data.chat);
          // Update the chat in the list
          setChats(prevChats => prevChats.map(c => c._id === data.chat._id ? data.chat : c));
          // Mark as read after refresh (since user is viewing it)
          markChatAsRead(data.chat._id);
        } catch (err) {
          console.error('Failed to refresh chat:', err);
        }
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [view, selectedChat]);

  const loadCurrentUser = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getCurrentUser();
      setCurrentUser(data.user);
      setView(data.user.isAdmin ? 'admin' : 'dashboard');
      await loadMatches();
      await loadRequests();
    } catch (err) {
      console.error('Failed to load user:', err);
      localStorage.removeItem('skillswap_token');
      setView('login');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const data = await userAPI.getMatches();
      setMatches(data.matches);
    } catch (err) {
      console.error('Failed to load matches:', err);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await requestAPI.getIncomingRequests();
      setRequests(data.requests);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const loadChats = async () => {
    try {
      const data = await chatAPI.getChats();
      setChats(data.chats);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  // Mark chat as read when viewing it
  const markChatAsRead = (chatId) => {
    const chat = chats.find(c => c._id === chatId);
    if (chat && chat.messages.length > 0) {
      const lastMessageId = chat.messages[chat.messages.length - 1]._id;
      const updated = { ...lastSeenMessages, [chatId]: lastMessageId };
      setLastSeenMessages(updated);
      localStorage.setItem('lastSeenMessages', JSON.stringify(updated));
    }
  };

  // Count unread chats
  const getUnreadCount = () => {
    return chats.filter(chat => {
      if (chat.messages.length === 0) return false;
      const lastMessageId = chat.messages[chat.messages.length - 1]._id;
      const lastSeenId = lastSeenMessages[chat._id];
      
      // Unread if: no lastSeen OR lastSeen is different from latest message
      return !lastSeenId || lastSeenId !== lastMessageId;
    }).length;
  };

  const loadAdminUsers = async () => {
    try {
      const data = await adminAPI.getAllUsers();
      setAdminUsers(data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await authAPI.login(loginForm);
      
      localStorage.setItem('skillswap_token', data.token);
      setCurrentUser(data.user);
      setView(data.user.isAdmin ? 'admin' : 'dashboard');
      
      await loadMatches();
      await loadRequests();
      
      if (data.user.isAdmin) {
        await loadAdminUsers();
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userData = {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        bio: signupForm.bio,
        offeredSkills: signupForm.offeredSkills.split(',').map(s => s.trim()).filter(Boolean),
        desiredSkills: signupForm.desiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      };

      await authAPI.register(userData);
      alert('Account created successfully! Please login.');
      setView('login');
      setSignupForm({ name: '', email: '', password: '', offeredSkills: '', desiredSkills: '', bio: '' });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (targetUser) => {
    try {
      setLoading(true);
      await requestAPI.sendRequest(targetUser._id);
      alert(`Request sent to ${targetUser.name}!`);
    } catch (err) {
      alert(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      setLoading(true);
      await requestAPI.acceptRequest(requestId);
      await loadRequests();
      await loadChats();
      alert('Request accepted! You can now chat.');
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    
    try {
      await chatAPI.sendMessage(selectedChat._id, message);
      setMessage('');
      
      const data = await chatAPI.getChat(selectedChat._id);
      setSelectedChat(data.chat);
      setChats(chats.map(c => c._id === data.chat._id ? data.chat : c));
      
      // Auto-scroll to bottom
      setTimeout(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      await userAPI.updateProfile({
        name: currentUser.name,
        bio: currentUser.bio,
        offeredSkills: currentUser.offeredSkills,
        desiredSkills: currentUser.desiredSkills
      });
      alert('Profile updated successfully!');
      await loadMatches(); // Reload matches with updated skills
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('skillswap_token');
    setCurrentUser(null);
    setView('login');
    setMatches([]);
    setRequests([]);
    setChats([]);
    setSelectedChat(null);
  };

  const verifyUser = async (userId) => {
    try {
      await adminAPI.verifyUser(userId);
      await loadAdminUsers();
      alert('User verified successfully!');
    } catch (err) {
      alert(err.message || 'Failed to verify user');
    }
  };

  const filteredMatches = matches.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.offeredSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Login View
  if (view === 'login') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="app-title">SkillSwap</h1>
            <p className="app-subtitle">Student Skill Exchange Platform</p>
          </div>
          
          {error && (
            <div className="error-box">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="auth-footer">
            <button
              onClick={() => {
                setView('signup');
                setError('');
              }}
              className="btn-link"
              disabled={loading}
            >
              Don't have an account? Sign up
            </button>
          </div>
          
          <div className="info-box">
            <p><strong>💡 Demo: Run backend first!</strong></p>
            <p style={{fontSize: '12px'}}>Backend: npm run dev (port 5000)</p>
          </div>
        </div>
      </div>
    );
  }

  // Signup View
  if (view === 'signup') {
    return (
      <div className="auth-container">
        <div className="auth-card signup-card">
          <h1 className="page-title">Create Account</h1>
          
          {error && (
            <div className="error-box">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={signupForm.name}
              onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={signupForm.email}
              onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={signupForm.password}
              onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Skills You Offer (comma-separated)</label>
            <input
              type="text"
              value={signupForm.offeredSkills}
              onChange={(e) => setSignupForm({...signupForm, offeredSkills: e.target.value})}
              placeholder="React.js, Python, UI Design"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Skills You Want (comma-separated)</label>
            <input
              type="text"
              value={signupForm.desiredSkills}
              onChange={(e) => setSignupForm({...signupForm, desiredSkills: e.target.value})}
              placeholder="Node.js, MongoDB, Backend"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Bio</label>
            <textarea
              rows="3"
              value={signupForm.bio}
              onChange={(e) => setSignupForm({...signupForm, bio: e.target.value})}
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleSignup}
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          
          <div className="auth-footer">
            <button
              onClick={() => {
                setView('login');
                setError('');
              }}
              className="btn-link"
              disabled={loading}
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  if (view === 'admin') {
    if (!adminUsers.length && !loading) {
      loadAdminUsers();
    }
  }

  // Main Dashboard
  return (
    <div className="app-wrapper">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-brand">SkillSwap</h1>
          <div className="navbar-links">
            {currentUser?.isAdmin && (
              <button
                onClick={() => {
                  setView('admin');
                  loadAdminUsers();
                }}
                className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
              >
                <Shield size={20} />
                Admin
              </button>
            )}
            <button
              onClick={() => setView('dashboard')}
              className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            >
              <Book size={20} />
              Matches
            </button>
            <button
              onClick={() => {
                setView('chats');
                loadChats();
              }}
              className={`nav-btn ${view === 'chats' ? 'active' : ''}`}
            >
              <MessageCircle size={20} />
              Chats
              {getUnreadCount() > 0 && (
                <span className="badge-count">{getUnreadCount()}</span>
              )}
            </button>
            <button
              onClick={() => setView('profile')}
              className={`nav-btn ${view === 'profile' ? 'active' : ''}`}
            >
              <User size={20} />
              Profile
            </button>
            <button onClick={logout} className="nav-btn">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {view === 'admin' && (
          <div>
            <div className="page-header">
              <h2 className="page-title">User Management</h2>
              <p className="page-subtitle">Verify users and manage the platform</p>
            </div>

            <div className="card">
              {loading ? (
                <p className="loading-text">Loading users...</p>
              ) : (
                <div className="users-list">
                  {adminUsers.map(user => (
                    <div key={user._id} className="user-item">
                      <div className="user-info">
                        <h3>{user.name}</h3>
                        <p className="user-email">{user.email}</p>
                        <p className="user-skills">Offers: {user.offeredSkills.join(', ')}</p>
                        <p className="user-skills">Wants: {user.desiredSkills.join(', ')}</p>
                      </div>
                      <div className="user-actions">
                        {user.verified ? (
                          <span className="badge badge-success">
                            <Check size={16} />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => verifyUser(user._id)}
                            className="btn btn-primary"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div>
            <div className="page-header">
              <h2 className="page-title">Your Skill Matches</h2>
              <p className="page-subtitle">Connect with students who can help you learn!</p>
            </div>

            {requests.length > 0 && (
              <div className="requests-box">
                <h3>Incoming Requests ({requests.length})</h3>
                {requests.map(req => (
                  <div key={req._id} className="request-item">
                    <span>{req.from.name} wants to connect</span>
                    {req.status === 'pending' && (
                      <button
                        onClick={() => acceptRequest(req._id)}
                        className="btn btn-success btn-sm"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="search-box">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="matches-grid">
              {filteredMatches.map(match => (
                <div key={match._id} className="match-card">
                  <div className="match-header">
                    <h3>{match.name}</h3>
                    {match.verified && (
                      <span className="badge badge-success badge-sm">
                        <Check size={14} />
                        Verified
                      </span>
                    )}
                  </div>
                  
                  <p className="match-bio">{match.bio}</p>
                  
                  <div className="skills-section">
                    <p className="skills-label">Offers:</p>
                    <div className="skills-tags">
                      {match.offeredSkills.map((skill, i) => (
                        <span key={i} className="skill-tag skill-offer">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="skills-section">
                    <p className="skills-label">Wants to learn:</p>
                    <div className="skills-tags">
                      {match.desiredSkills.map((skill, i) => (
                        <span key={i} className="skill-tag skill-want">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => sendRequest(match)}
                    disabled={loading}
                    className="btn btn-primary btn-block"
                  >
                    Send Request
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'chats' && (
          <div className="chat-container">
            <div className="chat-sidebar">
              <div className="chat-sidebar-header">
                <h2>Messages</h2>
              </div>
              {chats.length === 0 ? (
                <p className="empty-message">No active chats yet</p>
              ) : (
                chats.map(chat => {
                  const otherUser = chat.participants.find(p => p._id !== currentUser.id);
                  const lastMessageId = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1]._id : null;
                  const lastSeenId = lastSeenMessages[chat._id];
                  const isUnread = lastMessageId && lastMessageId !== lastSeenId;
                  
                  return (
                    <div
                      key={chat._id}
                      onClick={() => {
                        setSelectedChat(chat);
                        markChatAsRead(chat._id);
                      }}
                      className={`chat-list-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <p className="chat-user-name">{otherUser?.name}</p>
                          <p className="chat-message-count">{chat.messages.length} messages</p>
                        </div>
                        {isUnread && (
                          <span style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#ef4444',
                            borderRadius: '50%',
                            flexShrink: 0
                          }}></span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="chat-main">
              {selectedChat ? (
                <>
                  <div className="chat-header">
                    <h3>
                      {selectedChat.participants.find(p => p._id !== currentUser.id)?.name}
                    </h3>
                  </div>
                  
                  <div className="chat-messages">
                    {selectedChat.messages.map(msg => (
                      <div
                        key={msg._id}
                        className={`chat-message ${msg.sender._id === currentUser.id ? 'sent' : 'received'}`}
                      >
                        <div className="message-bubble">
                          <p className="message-sender">{msg.sender.name}</p>
                          <p className="message-text">{msg.text}</p>
                          <p className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="chat-input">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Type a message..."
                    />
                    <button onClick={sendChatMessage} className="btn btn-primary">
                      <Send size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="chat-empty">
                  Select a chat to start messaging
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'profile' && currentUser && (
          <div className="profile-container">
            <div className="card">
              <h2 className="section-title">My Profile</h2>
              
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <p style={{padding: '12px 0', color: '#6b7280'}}>{currentUser.email}</p>
              </div>
              
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  rows="3"
                  value={currentUser.bio}
                  onChange={(e) => setCurrentUser({...currentUser, bio: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Skills I Offer (comma-separated)</label>
                <input
                  type="text"
                  value={currentUser.offeredSkills.join(', ')}
                  onChange={(e) => setCurrentUser({
                    ...currentUser, 
                    offeredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  disabled={loading}
                  placeholder="React.js, Python, UI Design"
                />
              </div>
              
              <div className="form-group">
                <label>Skills I Want to Learn (comma-separated)</label>
                <input
                  type="text"
                  value={currentUser.desiredSkills.join(', ')}
                  onChange={(e) => setCurrentUser({
                    ...currentUser, 
                    desiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  disabled={loading}
                  placeholder="Node.js, MongoDB, Backend"
                />
              </div>
              
              <button
                onClick={updateProfile}
                disabled={loading}
                className="btn btn-primary btn-block"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;