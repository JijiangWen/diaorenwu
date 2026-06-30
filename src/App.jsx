import React, { useState, useEffect, useRef } from 'react';
import Auth from './components/Auth';
import HouseMap from './components/HouseMap';

const EMOJI_OPTIONS = [
  '🎮', '🐱', '🍕', '🍺', '🛀', '🛌',
  '💼', '🏃', '🍜', '🍩', '🐼', '🦊',
  '🎧', '👾', '🔥', '👑', '🌈', '👽'
];

const COLOR_OPTIONS = [
  { name: '电竞青', value: '#00dec9' },
  { name: '甜心粉', value: '#ff5e97' },
  { name: '幻影紫', value: '#6c5ce7' },
  { name: '活力橙', value: '#ff9f43' },
  { name: '深海蓝', value: '#00a8ff' },
  { name: '极客绿', value: '#2ecc71' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('connecting');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [editEmoji, setEditEmoji] = useState('🎮');
  const [editColor, setEditColor] = useState('#00dec9');
  const [editCaption, setEditCaption] = useState('');
  const [updateError, setUpdateError] = useState('');

  const pollingRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('game_house_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        fetchUsers();
      } catch (e) {
        localStorage.removeItem('game_house_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => fetchUsersSilently(), 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setUsers([]);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentUser ? currentUser.username : null]);

  const fetchUsers = async () => {
    setLoading(true);
    setSyncStatus('connecting');
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('同步失败');
      const data = await res.json();
      setUsers(data);
      setSyncStatus('synced');
      updateCurrentUserFromSync(data);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersSilently = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setSyncStatus('synced');
        updateCurrentUserFromSync(data);
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      setSyncStatus('error');
    }
  };

  const updateCurrentUserFromSync = (data) => {
    if (!currentUser) return;
    const myLatestInfo = data.find(u => u.usernameLower === currentUser.username.toLowerCase());
    if (myLatestInfo && (
      myLatestInfo.status !== currentUser.status ||
      myLatestInfo.emoji !== currentUser.emoji ||
      myLatestInfo.color !== currentUser.color ||
      myLatestInfo.caption !== currentUser.caption
    )) {
      setCurrentUser(prev => ({
        ...prev,
        status: myLatestInfo.status,
        emoji: myLatestInfo.emoji,
        color: myLatestInfo.color,
        caption: myLatestInfo.caption
      }));
    }
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setEditEmoji(userData.emoji || '🎮');
    setEditColor(userData.color || '#00dec9');
    setEditCaption(userData.caption || '准备开黑！');
  };

  const handleLogout = () => {
    localStorage.removeItem('game_house_user');
    setCurrentUser(null);
  };

  const handleMoveRoom = async (newStatus) => {
    if (!currentUser) return;
    setSyncStatus('connecting');
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          token: currentUser.token,
          status: newStatus
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          handleLogout();
          alert('登录超时，请重新登录');
        } else {
          throw new Error(data.error || '移动失败');
        }
        return;
      }
      setCurrentUser(prev => ({ ...prev, status: newStatus }));
      fetchUsersSilently();
    } catch (err) {
      console.error(err);
      alert(err.message || '网络连接异常，请重试');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setUpdateError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          token: currentUser.token,
          emoji: editEmoji,
          color: editColor,
          caption: editCaption
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          handleLogout();
          alert('登录超时，请重新登录');
        } else {
          throw new Error(data.error || '更新失败');
        }
        return;
      }
      const updatedUser = { ...currentUser, emoji: editEmoji, color: editColor, caption: editCaption };
      setCurrentUser(updatedUser);
      localStorage.setItem('game_house_user', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      setIsMobileDrawerOpen(false);
      fetchUsersSilently();
    } catch (err) {
      setUpdateError(err.message);
    }
  };

  const startEditProfile = () => {
    setEditEmoji(currentUser.emoji);
    setEditColor(currentUser.color);
    setEditCaption(currentUser.caption || '');
    setIsEditingProfile(true);
    setUpdateError('');
    setIsMobileDrawerOpen(true);
  };

  const renderSidebar = (extraClass = '') => {
    return (
      <aside className={`app-sidebar ${extraClass}`}>
        {isEditingProfile && (
          <div className="glass-panel sidebar-card animate-slide-up">
            <div className="sidebar-card-header">
              <h3 className="sidebar-card-title">⚙️ 修改个人状态/头像</h3>
              <button className="close-btn" onClick={() => { setIsEditingProfile(false); setIsMobileDrawerOpen(false); }}>✕</button>
            </div>

            {updateError && <div className="error-text">⚠️ {updateError}</div>}

            <form onSubmit={handleUpdateProfile}>
              <div className="input-group">
                <label className="input-label">我的头像 (Emoji)</label>
                <div className="avatar-selection-grid">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <div
                      key={emoji}
                      className={`avatar-selection-item ${editEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setEditEmoji(emoji)}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">我的发光色</label>
                <div className="color-selection-grid">
                  {COLOR_OPTIONS.map((c) => (
                    <div
                      key={c.value}
                      className={`color-selection-item ${editColor === c.value ? 'selected' : ''}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setEditColor(c.value)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label className="input-label" htmlFor="edit-caption">当前签名</label>
                <input
                  className="text-input"
                  type="text"
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="我想说什么..."
                  maxLength={30}
                />
              </div>

              <div className="form-actions">
                <button className="btn-primary" type="submit" style={{ flex: 2 }}>保存修改</button>
                <button className="btn-secondary" type="button" onClick={() => { setIsEditingProfile(false); setIsMobileDrawerOpen(false); }} style={{ flex: 1 }}>取消</button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-panel sidebar-card">
          <h3 className="sidebar-card-title" style={{ marginBottom: '16px' }}>👥 所有工作伙 / 叼毛 ({users.length})</h3>

          <div className="friends-list">
            {users.length === 0 ? (
              <div className="empty-friends">暂无其他注册叼毛</div>
            ) : (
              users.map((user) => {
                const isMe = user.usernameLower === currentUser.username.toLowerCase();

                return (
                  <div
                    key={user.usernameLower}
                    className="friend-row"
                    style={{
                      borderLeftColor: user.color,
                      background: isMe ? 'rgba(255, 255, 255, 0.03)' : 'transparent'
                    }}
                  >
                    <div
                      className="avatar-circle small"
                      style={{
                        backgroundColor: user.color,
                        boxShadow: `0 2px 8px ${user.color}30`
                      }}
                    >
                      {user.emoji}
                    </div>

                    <div className="friend-info">
                      <div className="friend-header-line">
                        <span className="friend-name">
                          {user.username} {isMe && <span className="me-tag">(我)</span>}
                        </span>
                      </div>
                      <p className="friend-caption" title={user.caption}>
                        {user.caption || '这人很懒，什么都没写~'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    );
  };

  if (!currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const onlineGamers = users.filter(u => u.status === 'gaming');

  return (
    <div className="app-wrapper">
      <div
        className="top-glow"
        style={{
          backgroundColor: currentUser.color,
          boxShadow: `0 0 80px 20px ${currentUser.color}15`
        }}
      />

      <header className="glass-panel app-header">
        <div className="brand-group">
          <span className="brand-icon">🏠</span>
          <h1 className="brand-name">叼人屋</h1>
        </div>

        <div className="sync-container">
          <span
            className="sync-dot"
            style={{
              backgroundColor: syncStatus === 'synced' ? '#2ecc71' : syncStatus === 'connecting' ? '#ff9f43' : '#ff7675'
            }}
          />
          <span className="sync-text">
            {syncStatus === 'synced' ? '已实时同步' : syncStatus === 'connecting' ? '同步中...' : '连接失败'}
          </span>
          <button className="sync-btn" onClick={fetchUsersSilently} title="手动同步">🔄</button>
        </div>

        <div className="user-profile">
          <div
            className="avatar-circle small"
            style={{
              backgroundColor: currentUser.color,
              boxShadow: `0 0 10px ${currentUser.color}80`,
              cursor: 'pointer'
            }}
            onClick={startEditProfile}
          >
            {currentUser.emoji}
          </div>
          <div className="user-info" onClick={startEditProfile}>
            <span className="user-name">{currentUser.username}</span>
            <span className="user-status">点击修改状态</span>
          </div>
          <div className="user-actions">
            <button className="btn-icon" onClick={startEditProfile} title="修改个人信息">⚙️</button>
            <button className="btn-icon logout-btn" onClick={handleLogout} title="退出登录">🚪</button>
          </div>
        </div>
      </header>

      {onlineGamers.length > 0 && (
        <section className="glass-panel banner">
          <span className="banner-emoji">📢</span>
          <div className="banner-content">
            当前有 <strong style={{ color: 'var(--color-gaming)' }}>{onlineGamers.length}</strong> 位叼毛在 <strong>叼人客厅</strong> 准备开黑！
            {onlineGamers.map(u => u.username).join(', ')} 都在线，快去联系他们吧！
          </div>
        </section>
      )}

      <main className="app-main-layout">
        <section className="house-section">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p style={{ marginTop: '15px', color: 'var(--color-text-secondary)' }}>正在进入小屋...</p>
            </div>
          ) : (
            <HouseMap users={users} currentUser={currentUser} onMoveRoom={handleMoveRoom} />
          )}
        </section>

        {/* Desktop Sidebar (Only visible on screens > 900px) */}
        {renderSidebar("desktop-only")}
      </main>

      {/* Mobile Floating Action Button (FAB) for Friends Sheet */}
      <button
        className="mobile-fab animate-float"
        onClick={() => setIsMobileDrawerOpen(true)}
        title="查看所有工作伙 / 叼毛"
      >
        👥
      </button>

      {/* Mobile Drawer Backdrop Overlay */}
      <div
        className={`drawer-overlay ${isMobileDrawerOpen ? 'active' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      {/* Mobile Drawer Bottom Sheet */}
      <div className={`mobile-drawer ${isMobileDrawerOpen ? 'active' : ''}`}>
        <div className="drawer-handle" onClick={() => setIsMobileDrawerOpen(false)} />
        {renderSidebar()}
      </div>
    </div>
  );
}
