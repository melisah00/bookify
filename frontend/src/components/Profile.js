import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Avatar, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/auth/user-info', { withCredentials: true })
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch user info:', error.response || error.message);
        setLoading(false);
      });
  }, []);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Typography variant="h6" sx={{ mt: 6, textAlign: 'center' }}>
        Could not load user info.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      <Card sx={{ maxWidth: 500, width: '100%', p: 3, borderRadius: 4, boxShadow: 4 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={user.icon || undefined}
            sx={{ width: 100, height: 100, bgcolor: '#66b2a0', fontSize: 36 }}
          >
            {user.first_name?.[0]}{user.last_name?.[0]}
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            {user.first_name} {user.last_name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            @{user.username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: {user.email}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Roles: {user.roles?.join(', ')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
