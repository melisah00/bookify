// // src/components/admin/ForumUserTable.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../../contexts/AuthContext';

// // Globalni axios default
// axios.defaults.withCredentials = true;
// axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// export default function ForumUserTable() {
//   const { loading: authLoading, hasRole } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Dohvati sve korisnike (bez admina, backend već filtrira)
//   const fetchUsers = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await axios.get('/users/');
//       setUsers(response.data);
//     } catch (err) {
//       console.error('Error fetching users:', err);
//       setError(
//         err.response?.data?.detail ||
//         (typeof err.response?.data === 'string'
//           ? err.response.data
//           : JSON.stringify(err.response?.data)) ||
//         err.message ||
//         'Network error'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!authLoading && (hasRole('forum_admin') || hasRole('admin'))) {
//       fetchUsers();
//     } else if (!authLoading) {
//       setLoading(false);
//     }
//   }, [authLoading, hasRole]);

//   const toggleModerator = async (userId, isModerator) => {
//     try {
//       if (isModerator) {
//         await axios.delete(`/users/${userId}/roles/forum_moderator`);
//       } else {
//         await axios.post(`/users/${userId}/roles`, { role: 'forum_moderator' });
//       }

//       // Ažuriraj lokalno stanje korisnika
//       setUsers(users.map(u =>
//         u.id === userId
//           ? {
//               ...u,
//               roles: isModerator
//                 ? u.roles.filter(r => r !== 'forum_moderator')
//                 : [...u.roles, 'forum_moderator']
//             }
//           : u
//       ));
//     } catch (err) {
//       console.error('Error updating role:', err);
//       const errorMessage =
//         err.response?.data?.detail ||
//         (typeof err.response?.data === 'string'
//           ? err.response.data
//           : JSON.stringify(err.response?.data)) ||
//         err.message;

//       alert(`Action failed: ${errorMessage}`);
//     }
//   };

//   if (authLoading || loading) return <div className="p-4 text-center">Loading users...</div>;
//   if (!(hasRole('forum_admin') || hasRole('admin'))) {
//     return <div className="p-4 text-center text-red-500">Not authorized to access this page.</div>;
//   }

//   return (
//     <div className="p-4">
//       <h2 className="text-2xl font-bold mb-6 text-gray-800">Forum User Management</h2>
//       {error && (
//         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>
//       )}
//       <div className="overflow-x-auto rounded-lg shadow">
//         <table className="min-w-full bg-white">
//           <thead className="bg-gray-800 text-white">
//             <tr>
//               <th className="py-3 px-4 text-left">Username</th>
//               <th className="py-3 px-4 text-left">First Name</th>
//               <th className="py-3 px-4 text-left">Last Name</th>
//               <th className="py-3 px-4 text-left">Roles</th>
//               <th className="py-3 px-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {users.map(user => {
//               const isModerator = user.roles?.includes('forum_moderator');
//               return (
//                 <tr key={user.id} className="hover:bg-gray-50">
//                   <td className="py-3 px-4">{user.username}</td>
//                   <td className="py-3 px-4">{user.first_name || '-'}</td>
//                   <td className="py-3 px-4">{user.last_name || '-'}</td>
//                   <td className="py-3 px-4">
//                     <div className="flex flex-wrap gap-1">
//                       {user.roles.map((role, idx) => (
//                         <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
//                           {role}
//                         </span>
//                       ))}
//                     </div>
//                   </td>
//                   <td className="py-3 px-4 text-center">
//                     <button
//                       onClick={() => toggleModerator(user.id, isModerator)}
//                       className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//                         isModerator
//                           ? 'bg-red-500 hover:bg-red-600 text-white'
//                           : 'bg-green-500 hover:bg-green-600 text-white'
//                       }`}
//                     >
//                       {isModerator ? 'Remove Moderator' : 'Add Moderator'}
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
