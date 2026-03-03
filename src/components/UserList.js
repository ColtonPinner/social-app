import React from 'react';
import { Link } from 'react-router-dom';
import { useBackendUsersQuery } from '../hooks/useBackendUsers';

const UserList = () => {
  const { data: users = [], isLoading, error } = useBackendUsersQuery('', {
    enabled: true,
    limit: 50,
  });

  return (
    <div>
      <h1>User List</h1>
      {isLoading && <p>Loading users...</p>}
      {error && <p>Failed to load users.</p>}
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <Link to={`/profile/${user.id}`}>{user.username}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;