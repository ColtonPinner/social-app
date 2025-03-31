import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';

const Messages = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchConversations();
    subscribeToNewMessages();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user:profiles(id, username, avatar_url, full_name)
          )
        `)
        .contains('participant_ids', [user.id]);

      if (error) throw error;
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          if (payload.new.conversation_id === activeConversation?.id) {
            fetchMessages(activeConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .neq('id', user.id)
        .ilike('username', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const createConversation = async (otherUser) => {
    try {
      const { data: existingConvs, error: checkError } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id, otherUser.id])
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingConvs) {
        setActiveConversation(existingConvs);
        return;
      }

      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert([{
          participant_ids: [user.id, otherUser.id],
        }])
        .select()
        .single();

      if (createError) throw createError;

      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUser.id }
      ]);

      setActiveConversation(newConv);
      fetchConversations();
    } catch (err) {
      console.error('Error creating conversation:', err);
    } finally {
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar with Search */}
      <div className="w-1/3 border-r border-light-border dark:border-dark-border flex flex-col">
        <div className="p-4 border-b border-light-border dark:border-dark-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
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

        {/* Search Results */}
        {showSearch && searchResults.length > 0 ? (
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => createConversation(result)}
                className="w-full flex items-center p-3 rounded-lg
                  hover:bg-light-secondary dark:hover:bg-dark-tertiary
                  transition-colors duration-200"
              >
                <img
                  src={result.avatar_url || '/default-avatar.png'}
                  alt={result.username}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-light-text dark:text-dark-text">
                    {result.full_name || result.username}
                  </p>
                  <p className="text-sm text-light-muted dark:text-dark-textSecondary">
                    @{result.username}
                  </p>
                </div>
                <PlusIcon className="h-5 w-5 text-light-muted dark:text-dark-textSecondary" />
              </button>
            ))}
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            currentUser={user}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="w-2/3">
        {activeConversation ? (
          <MessageThread
            conversation={activeConversation}
            currentUser={user}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-light-muted dark:text-dark-textSecondary">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;