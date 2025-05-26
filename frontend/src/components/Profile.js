import React from 'react';
import {
  Box, Card, CardContent, Avatar, Typography, CircularProgress,
  Button, Divider, Chip, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, loading } = useAuth();

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
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
      <Card sx={{ maxWidth: 600, width: '100%', p: 3, borderRadius: 4, boxShadow: 4 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={user.icon || undefined}
              sx={{ width: 80, height: 80, bgcolor: '#66b2a0', fontSize: 32 }}
            >
              {user.first_name?.[0]}{user.last_name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
          </Box>


          <Box sx={{
            p: 2,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Personal Information
            </Typography>

            <Stack spacing={2}>
              <InfoRow label="First Name" value={user.first_name} />
              <InfoRow label="Last Name" value={user.last_name} />
              <InfoRow label="Username" value={user.username} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Date of Birth" value={user.dob || 'Not specified'} />
              <InfoRow label="Age" value={user.dob ? calculateAge(user.dob) + ' years' : 'Not specified'} />
            </Stack>

            <Box sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              pt: 1,
              borderTop: '1px solid #f0f0f0',
              marginTop: 'auto'
            }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => console.log('Edit personal information')}
                sx={{ mt: 1 }}
              >
                Edit Personal Info
              </Button>
            </Box>
          </Box>


          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Account Information
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body1">
                  {user.roles?.join(', ') || 'No role assigned'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => console.log('Change role')}
              >
                Change Role
              </Button>
            </Box>
          </Box>


          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Profile Picture
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                src={user.icon || undefined}
                sx={{ width: 60, height: 60, bgcolor: '#66b2a0', fontSize: 24 }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => console.log('Edit profile picture')}
              >
                Change Picture
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function InfoRow({ label, value, onEdit }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">
          {value}
        </Typography>
      </Box>
      {onEdit && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          Edit
        </Button>
      )}
    </Box>
  );
}

function calculateAge(dob) {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}