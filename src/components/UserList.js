import React from 'react';
import { Link } from 'react-router-dom';

const UserList = () => {
  const users = [
    { id: '1', username: 'User1' },
    { id: '2', username: 'User2' },
    // Add more users as needed
  ];

  return (
    <div>
      <h1>User List</h1>
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