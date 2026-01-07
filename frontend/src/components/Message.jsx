import React from 'react';

function Message({ role, text }) {
  return (
    <div className={`message-row ${role === 'user' ? 'user' : 'assistant'}`}>
      <div className="message-bubble">{text}</div>
    </div>
  );
}

export default Message;



