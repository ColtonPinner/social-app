import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const MessageThread = ({ conversation, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    scrollToBottom();
  }, [conversation.id]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, username, avatar_url)
        `)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          content: newMessage,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-light-border dark:border-dark-border">
        <h3 className="text-lg font-medium text-light-text dark:text-dark-text">
          {conversation.participants.find(p => p.user.id !== currentUser.id)
            ?.user.full_name}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${
              message.sender_id === currentUser.id 
                ? 'bg-dark-accent text-white' 
                : 'bg-light-secondary dark:bg-dark-tertiary text-light-text dark:text-dark-text'
              } rounded-lg px-4 py-2`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-light-border dark:border-dark-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg px-4 py-2
              bg-light-secondary dark:bg-dark-tertiary 
              text-light-text dark:text-dark-text
              border border-light-border dark:border-dark-border
              focus:ring-2 focus:ring-dark-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="p-2 rounded-lg bg-dark-accent text-white
              hover:bg-dark-accentHover transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageThread;