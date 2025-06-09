import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

import ForumCategoryCreate from './ForumCategoryCreate';
import ForumCategoryList from './ForumCategoryList';
import ForumCategoryTable from './ForumCategoryTable';

export default function ForumAdmin() {
  const [view, setView] = useState('listCategories');

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        forum_administrator
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button
          variant={view === 'listCategories' ? 'contained' : 'outlined'}
          onClick={() => setView('listCategories')}
          sx={{
            color: view === 'listCategories' ? 'white' : 'rgb(102,178,160)',
            borderColor: view === 'listCategories' ? 'rgb(102,178,160)' : 'rgb(102,178,160)',
            '&:hover': {
              borderColor: 'rgb(78,121,107)',
              color: 'rgb(78,121,107)',
            },
            backgroundColor: view === 'listCategories' ? 'rgb(102,178,160)' : 'transparent',
          }}
        >
          Category List
        </Button>

        <Button
          variant={view === 'forumCategoryTable' ? 'contained' : 'outlined'}
          onClick={() => setView('forumCategoryTable')}
          sx={{
            color: view === 'forumCategoryTable' ? 'white' : 'rgb(102,178,160)',
            borderColor: view === 'forumCategoryTable' ? 'rgb(102,178,160)' : 'rgb(102,178,160)',
            '&:hover': {
              borderColor: 'rgb(78,121,107)',
              color: 'rgb(78,121,107)',
            },
            backgroundColor: view === 'forumCategoryTable' ? 'rgb(102,178,160)' : 'transparent',
          }}
        >
          Maintain topics and categories
        </Button>
      </Stack>


      <Box>
        {view === 'listCategories' && <ForumCategoryList />}
        {view === 'createCategory' && <ForumCategoryCreate onCreated={() => setView('listCategories')} />}
        {view === 'forumCategoryTable' && <ForumCategoryTable onCreated={() => setView('forumCategoryTable')} />}
      </Box>
    </Box>
  );
}
