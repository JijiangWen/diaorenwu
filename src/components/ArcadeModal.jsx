import React, { useState, useEffect, useRef } from 'react';

export default function ArcadeModal({ currentUser, users, onClose, onScoreSubmitSuccess }) {
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [submittingScore, setSubmittingScore] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const playerPosRef = useRef({ x: 180, y: 350 });
  const gameActiveRef = useRef(false);

  // Sorting users by high score
  const leaderboard = [...users]
    .filter(u => u.arcadeHighScore !== undefined)
    .sort((a, b) => b.arcadeHighScore - a.arcadeHighScore)
    .slice(0, 7);

  const myRecord = currentUser?.arcadeHighScore || 0;

  // Handle canvas controls (Mouse & Touch)
  const getMousePos = (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;

    // Scale client coords to match canvas internal resolution
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handlePointerMove = (e) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const pos = getMousePos(canvasRef.current, e);
    // Constrain player within canvas boundaries
    playerPosRef.current = {
      x: Math.max(15, Math.min(canvasRef.current.width - 15, pos.x)),
      y: Math.max(15, Math.min(canvasRef.current.height - 15, pos.y))
    };
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setIsNewRecord(false);
    playerPosRef.current = { x: 180, y: 350 };
    gameActiveRef.current = true;
  };

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let localScore = 0;
    let frameCount = 0;
    let hazards = [];
    let baseSpeed = 3.5;
    let spawnRate = 30; // spawn hazard every X frames

    class Hazard {
      constructor() {
        this.x = Math.random() * (canvas.width - 20) + 10;
        this.y = -20;
        this.r = 8 + Math.random() * 10; // hazard radius
        this.speed = baseSpeed + Math.random() * 2.5;
        this.color = '#ff4d4d';
      }
      update() {
        this.y += this.speed;
      }
      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }
    }

    const updateGame = () => {
      if (!gameActiveRef.current) return;
      frameCount++;

      // Increase difficulty gradually
      if (frameCount % 300 === 0) {
        baseSpeed += 0.5;
        spawnRate = Math.max(8, spawnRate - 3);
      }

      // Increment score
      if (frameCount % 6 === 0) {
        localScore += 1;
        setScore(localScore);
      }

      // Clear canvas with trace opacity for motion blur trail
      ctx.fillStyle = 'rgba(12, 8, 24, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gridlines in background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Spawn hazards
      if (frameCount % spawnRate === 0) {
        hazards.push(new Hazard());
      }

      // Update and draw hazards
      for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        h.update();
        h.draw();

        // Collision Check: Player emoji center vs hazard center
        const dx = h.x - playerPosRef.current.x;
        const dy = h.y - playerPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dx * dx || dy * dy); // Safe distance formula

        // Approximate player collision radius is 14px
        if (distance < (h.r + 14)) {
          handleGameOver(localScore);
          return;
        }

        // Remove off-screen hazards
        if (h.y > canvas.height + 20) {
          hazards.splice(i, 1);
        }
      }

      // Draw Player (Using their custom avatar emoji!)
      ctx.save();
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = currentUser?.color || '#00dec9';
      ctx.shadowBlur = 10;
      ctx.fillText(currentUser?.emoji || '🎮', playerPosRef.current.x, playerPosRef.current.y);
      ctx.restore();

      requestRef.current = requestAnimationFrame(updateGame);
    };

    const handleGameOver = async (finalScore) => {
      gameActiveRef.current = false;
      cancelAnimationFrame(requestRef.current);
      setGameState('gameover');

      // Check if we hit a new high score
      if (finalScore > myRecord) {
        setIsNewRecord(true);
        setSubmittingScore(true);
        try {
          const res = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: currentUser.username,
              token: currentUser.token,
              score: finalScore
            })
          });
          if (res.ok) {
            // Update successful, trigger list reload to update local leaderboards
            onScoreSubmitSuccess(finalScore);
          }
        } catch (e) {
          console.error('Failed to submit score:', e);
        } finally {
          setSubmittingScore(false);
        }
      }
    };

    // Start Loop
    requestRef.current = requestAnimationFrame(updateGame);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(5, 3, 10, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        onClick={onClose}
      />

      {/* Main Panel */}
      <div className="glass-panel animate-scale-up" style={{
        position: 'relative', width: '100%', maxWidth: '780px',
        background: 'rgba(18, 14, 30, 0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 700 ? '1fr' : '1.2fr 1fr',
        gap: '20px',
        padding: '20px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      }}>
        {/* Game Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>🕹️ 极速闪避</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00dec9', fontFamily: 'monospace' }}>
              得分: {score}
            </span>
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '360/420',
            maxWidth: '360px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.05)',
            background: '#0c0818',
            cursor: gameState === 'playing' ? 'none' : 'default',
            touchAction: 'none'
          }}>
            <canvas
              ref={canvasRef}
              width={360}
              height={420}
              style={{ display: 'block', width: '100%', height: '100%' }}
              onMouseMove={handlePointerMove}
              onTouchMove={handlePointerMove}
            />

            {/* Game Screen Overlays */}
            {gameState === 'idle' && (
              <div style={overlayStyle}>
                <span style={{ fontSize: '3rem', marginBottom: '10px' }}>🛸</span>
                <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.2rem' }}>极速闪避</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '0 20px' }}>
                  手指/鼠标拖拽你的 Emoji 头像，闪避天空中坠落的红色陨石！
                </p>
                <button className="btn-primary" onClick={startGame} style={{ padding: '8px 24px' }}>
                  开始街机
                </button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div style={overlayStyle}>
                <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💥</span>
                <h3 style={{ margin: '0 0 4px 0', color: '#ff7675', fontSize: '1.3rem' }}>游戏结束</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#fff' }}>
                  最终得分: <strong style={{ color: '#00dec9', fontSize: '1.2rem' }}>{score}</strong>
                </p>

                {isNewRecord && (
                  <div style={{
                    backgroundColor: 'rgba(0, 222, 201, 0.1)',
                    border: '1px solid rgba(0, 222, 201, 0.3)',
                    color: '#00dec9',
                    fontSize: '0.75rem',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    fontWeight: 700,
                    animation: 'pulse-dot 2s infinite'
                  }}>
                    {submittingScore ? '正在上传新记录...' : '🎉 突破个人新纪录！'}
                  </div>
                )}

                <button className="btn-primary" onClick={startGame} style={{ padding: '8px 24px' }}>
                  再来一局
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Area */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>🏆 叼人街机排行榜</h3>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>我的最高: {myRecord}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: '30px 0' }}>
                  暂无电玩纪录
                </div>
              ) : (
                leaderboard.map((user, idx) => {
                  const isMe = user.usernameLower === currentUser?.username?.toLowerCase();
                  const trophy = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;

                  return (
                    <div
                      key={user.usernameLower}
                      style={{
                        display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                        padding: '10px 12px', borderRadius: '12px',
                        background: isMe ? 'rgba(0, 222, 201, 0.05)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isMe ? 'rgba(0, 222, 201, 0.2)' : 'rgba(255,255,255,0.03)'}`,
                      }}
                    >
                      <span style={{ width: '26px', fontSize: '0.85rem', fontWeight: 800, color: idx < 3 ? '#ff9f43' : 'rgba(255,255,255,0.3)' }}>
                        {trophy}
                      </span>
                      <div
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          backgroundColor: user.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', marginRight: '10px'
                        }}
                      >
                        {user.emoji}
                      </div>
                      <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.username} {isMe && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>(我)</span>}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00dec9', fontFamily: 'monospace' }}>
                        {user.arcadeHighScore}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose} style={{ padding: '8px 24px', width: window.innerWidth < 700 ? '100%' : 'auto' }}>
              退出电玩厅
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'absolute', inset: 0,
  background: 'rgba(12, 8, 24, 0.9)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '20px'
};
