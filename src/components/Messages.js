import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Messages.css';

const Messages = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiver, setReceiver] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data);
    }
  };

  const handleSendMessage = async () => {
    const { data: receiverData, error: receiverError } = await supabase
      .from('users')
      .select('id')
      .eq('email', receiverEmail)
      .single();

    if (receiverError) {
      console.error('Error fetching receiver:', receiverError);
    } else {
      setReceiver(receiverData);

      const { data, error } = await supabase
        .from('messages')
        .insert([{ sender_id: user.id, receiver_id: receiverData.id, content }])
        .select();

      if (error) {
        console.error('Error sending message:', error);
      } else {
        setMessages([data[0], ...messages]);
        setContent('');
      }
    }
  };

  return (
    <div className="messages-container">
      <h2>Messages</h2>
      <div className="message-input">
        <input
          type="email"
          placeholder="Receiver's email"
          value={receiverEmail}
          onChange={(e) => setReceiverEmail(e.target.value)}
        />
        <textarea
          placeholder="Type your message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div className="messages-list">
        {messages.map((message) => (
          <div key={message.id} className="message-item">
            <p>
              <strong>{message.sender_id}</strong> to <strong>{message.receiver_id}</strong>
            </p>
            <p>{message.content}</p>
            <p className="message-date">{new Date(message.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Messages;