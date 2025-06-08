import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

import ForumCategoryCreate from './ForumCategoryCreate';
import ForumCategoryList from './ForumCategoryList';
import ForumCategoryTable from './ForumCategoryTable';
import ForumUserTable from './ForumUserTable';

export default function ForumAdmin() {
  const [view, setView] = useState('listCategories');

  return (
    <Box sx={{ p: 4 }}>
      {/* Heading */}
      <Typography variant="h4" component="h1" gutterBottom>
        forum_administrator
      </Typography>

      {/* Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button variant={view === 'listCategories' ? 'contained' : 'outlined'} onClick={() => setView('listCategories')}>
          Lista kategorija
        </Button>
        <Button variant={view === 'createCategory' ? 'contained' : 'outlined'} onClick={() => setView('createCategory')}>
          Kreiraj kategoriju
        </Button>
        <Button variant={view === 'forumUserTabel' ? 'contained' : 'outlined'} onClick={() => setView('forumUserTabel')}>
          Lista topica
        </Button>
        <Button variant={view === 'forumCategoryTable' ? 'contained' : 'outlined'} onClick={() => setView('forumCategoryTable')}>
          Kreiraj topic
        </Button>
      </Stack>

      {/* Dynamic content */}
      <Box>
        {view === 'listCategories' && <ForumCategoryList />}
        {view === 'createCategory' && <ForumCategoryCreate onCreated={() => setView('listCategories')} />}
        {view === 'forumUserTabel' && <ForumUserTable />}
        {view === 'forumCategoryTable' && <ForumCategoryTable onCreated={() => setView('forumCategoryTable')} />} 
      </Box>
    </Box>
  );
}
