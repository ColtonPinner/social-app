import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../supabaseClient';

const ConversationList = ({ 
  conversations, 
  activeConversation, 
  setActiveConversation, 
  currentUser 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // Subscribe to presence changes
    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const currentState = channel.presenceState();
        const onlineIds = new Set(
          Object.values(currentState)
            .flat()
            .map(presence => presence.user_id)
        );
        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUser.id });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser.id]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .neq('id', currentUser.id)
        .ilike('username', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data);
      setShowSearch(true);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const startConversation = async (otherUser) => {
    try {
      // Check if conversation exists
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [currentUser.id, otherUser.id])
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      if (existingConv) {
        setActiveConversation(existingConv);
        setSearchQuery('');
        setShowSearch(false);
        return;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert([{
          participant_ids: [currentUser.id, otherUser.id],
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: currentUser.id },
        { conversation_id: newConv.id, user_id: otherUser.id }
      ]);

      setActiveConversation(newConv);
      setSearchQuery('');
      setShowSearch(false);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const UserSearchResult = ({ user }) => (
    <button
      key={user.id}
      onClick={() => startConversation(user)}
      className="w-full flex items-center p-3 rounded-lg
        hover:bg-light-secondary dark:hover:bg-dark-tertiary
        transition-colors duration-200"
    >
      <div className="relative">
        <img
          src={user.avatar_url || '/default-avatar.png'}
          alt={user.username}
          className="w-10 h-10 rounded-full mr-3 object-cover"
        />
        {onlineUsers.has(user.id) && (
          <span className="absolute bottom-0 right-2 h-3 w-3 rounded-full bg-green-500 
            ring-2 ring-white dark:ring-dark-primary" />
        )}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center">
          <p className="font-medium text-light-text dark:text-dark-text">
            {user.full_name || user.username}
          </p>
          {onlineUsers.has(user.id) && (
            <span className="ml-2 text-xs text-green-500">Online</span>
          )}
        </div>
        <p className="text-sm text-light-muted dark:text-dark-textSecondary">
          @{user.username}
        </p>
      </div>
      <PlusIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
    </button>
  );

  const ConversationItem = ({ conversation }) => {
    const otherParticipant = conversation.participants
      .find(p => p.user.id !== currentUser.id)?.user;

    return (
      <button
        onClick={() => setActiveConversation(conversation)}
        className={`w-full p-4 flex items-start space-x-3 hover:bg-light-secondary 
          dark:hover:bg-dark-tertiary transition-colors
          ${activeConversation?.id === conversation.id ? 
            'bg-light-secondary dark:bg-dark-tertiary' : ''}`}
      >
        <div className="relative">
          <img
            src={otherParticipant?.avatar_url || '/default-avatar.png'}
            alt={otherParticipant?.username}
            className="w-12 h-12 rounded-full"
          />
          {onlineUsers.has(otherParticipant?.id) && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 
              ring-2 ring-white dark:ring-dark-primary" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <div className="flex items-center">
              <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                {otherParticipant?.full_name || otherParticipant?.username}
              </p>
              {onlineUsers.has(otherParticipant?.id) && (
                <span className="ml-2 text-xs text-green-500">Online</span>
              )}
            </div>
            {conversation.last_message_at && (
              <span className="text-xs text-light-muted dark:text-dark-textSecondary">
                {format(new Date(conversation.last_message_at), 'MMM d')}
              </span>
            )}
          </div>
          <p className="text-sm text-light-muted dark:text-dark-textSecondary truncate">
            {conversation.last_message}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-light-border dark:border-dark-border space-y-4">
        <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
          Messages
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg
              bg-light-secondary dark:bg-dark-tertiary 
              text-light-text dark:text-dark-text
              border border-light-border dark:border-dark-border
              focus:ring-2 focus:ring-dark-accent focus:outline-none 
              placeholder-light-muted dark:placeholder-dark-textSecondary"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
        </div>
      </div>

      {/* Search Results or Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {showSearch ? (
          <div className="p-2 space-y-2">
            {searchResults.map((user) => (
              <UserSearchResult key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {conversations.map(conversation => (
              <ConversationItem key={conversation.id} conversation={conversation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;