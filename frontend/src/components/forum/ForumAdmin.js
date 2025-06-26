import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

import ForumCategoryCreate from './ForumCategoryCreate';
import ForumCategoryList from './ForumCategoryList';
import ForumCategoryTable from './ForumCategoryTable';
import AdminUserList from './AdminUserList';

export default function ForumAdmin() {
  const [view, setView] = useState('listCategories');

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          textAlign: 'center', fontWeight: 700,
          color: 'rgb(102,178,160)'
        }}
      >
        Forum administrator
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 4 }}
        justifyContent="center"
        flexWrap="wrap"
      >

        <Button
          variant={view === 'listCategories' ? 'contained' : 'outlined'}
          onClick={() => setView('listCategories')}
          sx={{
            color: view === 'listCategories' ? 'white' : 'rgb(102,178,160)',
            borderColor: 'rgb(102,178,160)',
            backgroundColor: view === 'listCategories' ? 'rgb(102,178,160)' : 'transparent',
            '&:hover': {
              borderColor: 'rgb(78,121,107)',
              color: 'rgb(78,121,107)',
            }
          }}
        >
          Category List
        </Button>

        <Button
          variant={view === 'forumCategoryTable' ? 'contained' : 'outlined'}
          onClick={() => setView('forumCategoryTable')}
          sx={{
            color: view === 'forumCategoryTable' ? 'white' : 'rgb(102,178,160)',
            borderColor: 'rgb(102,178,160)',
            backgroundColor: view === 'forumCategoryTable' ? 'rgb(102,178,160)' : 'transparent',
            '&:hover': {
              borderColor: 'rgb(78,121,107)',
              color: 'rgb(78,121,107)',
            }
          }}
        >
          Topics and categories
        </Button>

        <Button
          variant={view === 'userManagement' ? 'contained' : 'outlined'}
          onClick={() => setView('userManagement')}
          sx={{
            color: view === 'userManagement' ? 'white' : 'rgb(102,178,160)',
            borderColor: 'rgb(102,178,160)',
            backgroundColor: view === 'userManagement' ? 'rgb(102,178,160)' : 'transparent',
            '&:hover': {
              borderColor: 'rgb(78,121,107)',
              color: 'rgb(78,121,107)',
            }
          }}
        >
          User Management
        </Button>
      </Stack>


      <Box>
        {view === 'listCategories' && <ForumCategoryList />}
        {view === 'createCategory' && <ForumCategoryCreate onCreated={() => setView('listCategories')} />}
        {view === 'forumCategoryTable' && <ForumCategoryTable onCreated={() => setView('forumCategoryTable')} />}
        {view === 'userManagement' && <AdminUserList />}
      </Box>
    </Box>

  );
}
