import React, { useState } from 'react';

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

export default function Auth({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [caption, setCaption] = useState('准备开黑！');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = isRegister 
      ? { username, password, emoji: selectedEmoji, color: selectedColor, caption }
      : { username, password };

    const endpoint = isRegister ? '/api/register' : '/api/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登录或注册失败，请重试');
      }

      // Save user to localStorage
      localStorage.setItem('game_house_user', JSON.stringify({
        username: data.username,
        token: data.token,
        emoji: data.emoji,
        color: data.color
      }));

      onAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.authContainer} className="animate-slide-up">
      <div style={styles.headerBlock}>
        <span style={styles.logoIcon}>🏠</span>
        <h1 style={styles.title}>叼人屋</h1>
      </div>

      <div className="glass-panel" style={styles.formCard}>
        <div style={styles.tabHeader}>
          <button 
            style={{
              ...styles.tabBtn,
              ...( !isRegister ? styles.activeTab : {} )
            }}
            onClick={() => { setIsRegister(false); setError(''); }}
          >
            登 录
          </button>
          <button 
            style={{
              ...styles.tabBtn,
              ...( isRegister ? styles.activeTab : {} )
            }}
            onClick={() => { setIsRegister(true); setError(''); }}
          >
            注 册
          </button>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="input-group">
            <label className="input-label" htmlFor="username">用户名</label>
            <input 
              className="text-input"
              type="text" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: isRegister ? '20px' : '30px' }}>
            <label className="input-label" htmlFor="password">密码</label>
            <input 
              className="text-input"
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          {isRegister && (
            <>
              <div className="input-group">
                <label className="input-label">选择你的个性头像 (Emoji)</label>
                <div className="avatar-selection-grid">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <div 
                      key={emoji}
                      className={`avatar-selection-item ${selectedEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">选择发光颜色主题</label>
                <div className="color-selection-grid">
                  {COLOR_OPTIONS.map((c) => (
                    <div 
                      key={c.value}
                      className={`color-selection-item ${selectedColor === c.value ? 'selected' : ''}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setSelectedColor(c.value)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '30px' }}>
                <label className="input-label" htmlFor="caption">当前签名/喊话</label>
                <input 
                  className="text-input"
                  type="text" 
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="例如：在线求开黑，快来人！"
                />
              </div>
            </>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? '处理中...' : isRegister ? '注 册 并 登 录' : '立 即 登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  authContainer: {
    width: '100%',
    maxWidth: '460px',
    margin: '60px auto 40px auto',
    padding: '0 20px',
    textAlign: 'center',
  },
  headerBlock: {
    marginBottom: '32px',
  },
  logoIcon: {
    fontSize: '3.5rem',
    display: 'block',
    marginBottom: '10px',
    filter: 'drop-shadow(0 0 15px rgba(108, 92, 231, 0.4))'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #00dec9 0%, #6c5ce7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--color-text-secondary)',
  },
  formCard: {
    padding: '30px 24px',
    textAlign: 'left',
  },
  tabHeader: {
    display: 'flex',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '2px',
  },
  tabBtn: {
    flex: 1,
    background: 'none',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--color-text-muted)',
    fontSize: '1.1rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    padding: '10px 0',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  activeTab: {
    color: 'var(--color-gaming)',
    borderBottomColor: 'var(--color-gaming)',
  },
  errorAlert: {
    background: 'rgba(255, 118, 117, 0.15)',
    border: '1px solid rgba(255, 118, 117, 0.4)',
    color: '#ff7675',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  }
};
