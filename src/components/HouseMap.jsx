import React, { useState } from 'react';

const ROOMS = [
  {
    id: 'gaming',
    name: '叼人客厅',
    icon: '🎮',
    color: '#00dec9',
    description: '打游戏/开黑/在线',
    furniture: [
      { emoji: '🛋️', top: '60%', left: '8%', size: '2rem' },
      { emoji: '📺', top: '12%', left: '35%', size: '2.5rem' },
      { emoji: '🕹️', top: '62%', left: '70%', size: '1.6rem' },
    ],
    ambientLines: ['rgba(0,222,201,0.07)', 'rgba(108,92,231,0.12)'],
    gridArea: 'living',
  },
  {
    id: 'eating',
    name: '叼人厨房',
    icon: '🍳',
    color: '#ff9f43',
    description: '吃饭/干饭中',
    furniture: [
      { emoji: '🍲', top: '20%', left: '10%', size: '2rem' },
      { emoji: '🍽️', top: '55%', left: '55%', size: '1.8rem' },
      { emoji: '☕', top: '15%', left: '65%', size: '1.5rem' },
    ],
    ambientLines: ['rgba(255,159,67,0.07)', 'rgba(255,94,151,0.1)'],
    gridArea: 'kitchen',
  },
  {
    id: 'showering',
    name: '叼人浴室',
    icon: '🛁',
    color: '#00a8ff',
    description: '洗澡/泡澡中',
    furniture: [
      { emoji: '🛁', top: '30%', left: '15%', size: '2.2rem' },
      { emoji: '🦆', top: '20%', left: '70%', size: '1.4rem' },
      { emoji: '💦', top: '65%', left: '60%', size: '1.4rem' },
    ],
    ambientLines: ['rgba(0,168,255,0.07)', 'rgba(0,222,201,0.1)'],
    gridArea: 'bath',
  },
  {
    id: 'working',
    name: '叼人书房',
    icon: '💻',
    color: '#a55eea',
    description: '上班/学习/搬砖',
    furniture: [
      { emoji: '🖥️', top: '15%', left: '30%', size: '2.2rem' },
      { emoji: '📚', top: '55%', left: '10%', size: '1.8rem' },
      { emoji: '💡', top: '15%', left: '72%', size: '1.5rem' },
    ],
    ambientLines: ['rgba(165,94,234,0.07)', 'rgba(108,92,231,0.12)'],
    gridArea: 'study',
  },
  {
    id: 'sleeping',
    name: '叼人卧室',
    icon: '🛌',
    color: '#ff7675',
    description: '睡觉/挂机/梦游',
    furniture: [
      { emoji: '🛏️', top: '25%', left: '20%', size: '2.2rem' },
      { emoji: '🌙', top: '15%', left: '70%', size: '1.6rem' },
      { emoji: '🧸', top: '62%', left: '65%', size: '1.5rem' },
    ],
    ambientLines: ['rgba(255,118,117,0.07)', 'rgba(255,94,151,0.1)'],
    gridArea: 'bedroom',
  },
  {
    id: 'baby',
    name: '叼人婴儿房',
    icon: '🍼',
    color: '#fd79a8',
    description: '照顾女儿/带娃中',
    furniture: [
      { emoji: '🍼', top: '20%', left: '15%', size: '1.8rem' },
      { emoji: '🧸', top: '55%', left: '55%', size: '2.0rem' },
      { emoji: '🎠', top: '15%', left: '70%', size: '1.6rem' },
    ],
    ambientLines: ['rgba(253,121,168,0.07)', 'rgba(255,94,151,0.1)'],
    gridArea: 'nursery',
  },
  {
    id: 'commuting',
    name: '回家路上',
    icon: '🚃',
    color: '#f1c40f',
    description: '坐电车/地铁回家中',
    furniture: [
      { emoji: '🚃', top: '35%', left: '20%', size: '2.2rem' },
      { emoji: '🚉', top: '15%', left: '70%', size: '1.6rem' },
      { emoji: '🛣️', top: '65%', left: '60%', size: '1.4rem' },
    ],
    ambientLines: ['rgba(241,196,15,0.07)', 'rgba(255,159,67,0.1)'],
    gridArea: 'metro',
  },
  {
    id: 'out',
    name: '叼人阳台',
    icon: '🪴',
    color: '#2ecc71',
    description: '健身/出门/不在',
    furniture: [
      { emoji: '🪴', top: '15%', left: '10%', size: '1.8rem' },
      { emoji: '🏋️', top: '50%', left: '55%', size: '2rem' },
      { emoji: '☀️', top: '10%', left: '70%', size: '1.6rem' },
    ],
    ambientLines: ['rgba(46,204,113,0.07)', 'rgba(0,222,201,0.1)'],
    gridArea: 'balcony',
  }
];

// A single room card — used on both mobile carousel and desktop grid
function RoomCard({ room, roomUsers, isCurrentUserHere, currentUser, onMoveRoom, isMobile }) {
  const canMove = currentUser && currentUser.status !== room.id;

  return (
    <div
      onClick={() => canMove && onMoveRoom(room.id)}
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        border: `2px solid ${isCurrentUserHere ? room.color : 'rgba(255,255,255,0.06)'}`,
        background: `linear-gradient(135deg, ${room.ambientLines[0]} 0%, ${room.ambientLines[1]} 100%)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        cursor: canMove ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        boxShadow: isCurrentUserHere
          ? `0 0 24px ${room.color}50, 0 4px 20px rgba(0,0,0,0.4)`
          : '0 4px 20px rgba(0,0,0,0.3)',
        height: isMobile ? '240px' : '220px',
        width: '100%',
      }}
    >
      {/* Animated ambient background gradient */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.35,
        background: isCurrentUserHere
          ? `radial-gradient(ellipse at 50% 50%, ${room.color}30 0%, transparent 70%)`
          : 'none',
        pointerEvents: 'none',
      }} />

      {/* Room furniture decorations */}
      {room.furniture.map((f, i) => (
        <span key={i} style={{
          position: 'absolute',
          top: f.top, left: f.left,
          fontSize: f.size,
          opacity: 0.22,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {f.emoji}
        </span>
      ))}

      {/* "You are here" pulse ring */}
      {isCurrentUserHere && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          width: '10px', height: '10px', borderRadius: '50%',
          backgroundColor: room.color,
          boxShadow: `0 0 0 4px ${room.color}30`,
          animation: 'pulse-dot 2s infinite',
        }} />
      )}

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '1.5rem' }}>{room.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.95rem', fontWeight: 700, color: '#fff',
            fontFamily: "'Outfit', sans-serif",
          }}>{room.name}</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
            {room.description}
          </div>
        </div>
        <div style={{
          fontSize: '0.7rem', fontWeight: 700,
          padding: '3px 8px', borderRadius: '10px',
          backgroundColor: `${room.color}20`,
          border: `1px solid ${room.color}40`,
          color: room.color,
        }}>
          {roomUsers.length} 人
        </div>
      </div>

      {/* Wall line (floor plan feel) */}
      <div style={{
        position: 'absolute', top: '52px', left: '14px', right: '14px',
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${room.color}30, transparent)`,
      }} />

      {/* Avatars on the floor */}
      <div style={{
        position: 'absolute', top: '60px', left: 0, right: 0, bottom: '38px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', gap: '10px', padding: '0 16px',
      }}>
        {roomUsers.length === 0 ? (
          <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            空无一人
          </span>
        ) : (
          roomUsers.map((user) => {
            const isMe = currentUser && user.usernameLower === currentUser.username?.toLowerCase();
            return (
              <div key={user.usernameLower} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                animation: 'token-float 4s ease-in-out infinite',
                animationDelay: `${(user.usernameLower.charCodeAt(0) % 10) * 0.3}s`,
              }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  backgroundColor: user.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                  border: isMe ? '2.5px solid #fff' : `2px solid ${user.color}60`,
                  boxShadow: `0 4px 14px ${user.color}60`,
                }}>
                  {user.emoji}
                </div>
                <span style={{
                  fontSize: '0.65rem', color: '#fff', fontWeight: 600,
                  background: 'rgba(0,0,0,0.5)',
                  padding: '1px 6px', borderRadius: '8px',
                  maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {isMe ? '👈 我' : user.username}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        {isCurrentUserHere ? (
          <span style={{ fontSize: '0.72rem', color: room.color, fontWeight: 700 }}>● 你正在这里</span>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>点击移动到这里</span>
        )}
        {roomUsers.length > 0 && (
          <div style={{ display: 'flex', gap: '-4px' }}>
            {roomUsers.slice(0, 3).map(u => (
              <span key={u.usernameLower} style={{ fontSize: '1rem', marginLeft: '-2px' }}>{u.emoji}</span>
            ))}
            {roomUsers.length > 3 && (
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', alignSelf: 'center', marginLeft: '4px' }}>
                +{roomUsers.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile: horizontal swipeable carousel
function MobileHouseView({ rooms, users, currentUser, onMoveRoom }) {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (!currentUser) return 0;
    const idx = rooms.findIndex(r => r.id === currentUser.status);
    return idx >= 0 ? idx : 0;
  });

  const getUsersByRoom = (roomId) => users.filter(u => u.status === roomId);

  return (
    <div style={{ width: '100%' }}>
      {/* Room mini-map dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px'
      }}>
        {rooms.map((room, i) => {
          const count = getUsersByRoom(room.id).length;
          const isHere = currentUser && currentUser.status === room.id;
          return (
            <button
              key={room.id}
              onClick={() => setActiveIndex(i)}
              style={{
                width: activeIndex === i ? '32px' : '22px',
                height: '22px',
                borderRadius: '11px',
                border: `2px solid ${isHere ? room.color : activeIndex === i ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                background: activeIndex === i ? `${room.color}30` : 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem',
                transition: 'all 0.25s ease',
                position: 'relative',
              }}
              title={room.name}
            >
              <span style={{ fontSize: '0.8rem' }}>{room.icon}</span>
              {count > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: room.color, color: '#000',
                  fontSize: '0.55rem', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Room Card */}
      <div style={{ padding: '0 4px' }}>
        <RoomCard
          room={rooms[activeIndex]}
          roomUsers={getUsersByRoom(rooms[activeIndex].id)}
          isCurrentUserHere={currentUser && currentUser.status === rooms[activeIndex].id}
          currentUser={currentUser}
          onMoveRoom={onMoveRoom}
          isMobile={true}
        />
      </div>

      {/* Room name tabs */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: '8px',
        padding: '14px 0 4px', scrollbarWidth: 'none',
        justifyContent: 'center', flexWrap: 'wrap',
      }}>
        {rooms.map((room, i) => (
          <button
            key={room.id}
            onClick={() => setActiveIndex(i)}
            style={{
              padding: '6px 14px', borderRadius: '20px',
              border: `1px solid ${activeIndex === i ? room.color : 'rgba(255,255,255,0.1)'}`,
              background: activeIndex === i ? `${room.color}20` : 'transparent',
              color: activeIndex === i ? room.color : 'rgba(255,255,255,0.45)',
              fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {room.icon} {room.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// Desktop: floor plan grid
function DesktopHouseView({ rooms, users, currentUser, onMoveRoom }) {
  const getUsersByRoom = (roomId) => users.filter(u => u.status === roomId);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: 'auto auto auto',
      gridTemplateAreas: `
        "living living kitchen"
        "bedroom nursery bath"
        "metro study balcony"
      `,
      gap: '14px',
    }}>
      {/* Wall decor between rooms */}
      {rooms.map(room => (
        <div key={room.id} style={{ gridArea: room.gridArea }}>
          <RoomCard
            room={room}
            roomUsers={getUsersByRoom(room.id)}
            isCurrentUserHere={currentUser && currentUser.status === room.id}
            currentUser={currentUser}
            onMoveRoom={onMoveRoom}
            isMobile={false}
          />
        </div>
      ))}
    </div>
  );
}

export default function HouseMap({ users, currentUser, onMoveRoom }) {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 700);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(0,222,201,0.5); }
          70% { box-shadow: 0 0 0 10px rgba(0,222,201,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,222,201,0); }
        }
        @keyframes token-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      {isMobile
        ? <MobileHouseView rooms={ROOMS} users={users} currentUser={currentUser} onMoveRoom={onMoveRoom} />
        : <DesktopHouseView rooms={ROOMS} users={users} currentUser={currentUser} onMoveRoom={onMoveRoom} />
      }
    </div>
  );
}
