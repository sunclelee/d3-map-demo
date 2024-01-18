import React from 'react';

function PopTooltip(props) {
  const { visible, x, y, record } = props;
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 3,
        padding: 10,
        boxShadow: 'gray 0 0 8px 2px',
        left: x,
        top: y,
        pointerEvents: 'none',
      }}
    >
      {record?.name}
      <br />
      项目数量: {record?.number || 0}
    </div>
  );
}

export default PopTooltip;
