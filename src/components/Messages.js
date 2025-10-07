import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAutoRefresh, useGlobalAutoRefreshSettings } from '../hooks/useAutoRefresh';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import './Messages.css';

const Messages = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiver, setReceiver] = useState(null);
  const [error, setError] = useState(null);

  // Get global auto-refresh settings
  const { settings } = useGlobalAutoRefreshSettings();

  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
      throw err; // Re-throw for auto-refresh hook to handle
    }
  }, []);

  // Set up auto-refresh with global settings
  const autoRefreshConfig = {
    interval: settings.interval,
    enabled: settings.enabled && settings.messagesEnabled,
    pauseOnVisibilityChange: settings.pauseOnVisibilityChange,
    pauseOnOffline: settings.pauseOnOffline
  };

  const {
    isRefreshing: autoRefreshing,
    lastRefresh,
    error: autoRefreshError,
    retryCount
  } = useAutoRefresh(fetchMessages, autoRefreshConfig);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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

  // Combine errors from both manual refresh and auto-refresh
  const displayError = error || autoRefreshError;

  return (
    <div className="messages-container">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">Messages</h2>
        
        {/* Auto-refresh status */}
        <div className="flex items-center space-x-2 text-sm text-light-muted dark:text-dark-textSecondary">
          <ArrowPathIcon className={`h-4 w-4 ${autoRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm text-light-muted dark:text-dark-textSecondary">
            {autoRefreshing ? 'Refreshing...' : 
             lastRefresh ? `Updated: ${new Date(lastRefresh).toLocaleTimeString()}` :
             'Auto-refresh enabled'}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {displayError && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading messages</h3>
              <div className="mt-1 text-sm text-red-700">{displayError}</div>
              {retryCount > 0 && (
                <div className="mt-1 text-xs text-red-600">
                  Failed attempts: {retryCount}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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