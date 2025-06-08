import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Collapse, Typography, Stack,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Tooltip, Fade, Checkbox, FormControlLabel, Chip
} from '@mui/material';
import {
  KeyboardArrowDown, KeyboardArrowUp, Edit, Delete, Save, Cancel, Add,
  Folder, FolderOpen, Topic, Description, PushPin, Lock, Visibility, Schedule
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const palette = {
  backgroundLight: "#f8f9fa",
  backgroundMedium: "#e9ecef",
  accentPrimary: "rgb(102,178,160)",
  accentSecondary: "rgb(78,121,107)",
  success: "rgb(225,234,229)",
  textPrimary: "#212529",
  textSecondary: "#6c757d",
  error: "#e63946",
  warning: "#f77f00",
  hoverLight: "rgba(67, 97, 238, 0.08)",
  borderLight: "rgba(0, 0, 0, 0.12)"
};

const Row = React.memo(function Row({ category, onUpdateCategory, onDeleteCategory }) {
  const auth = useAuth();
  const currentUser = auth.user;

  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editDesc, setEditDesc] = useState(category.description || '');

  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [editTopicOpen, setEditTopicOpen] = useState(false);
  const [editTopicData, setEditTopicData] = useState({ 
    title: '', 
    description: '',
    is_pinned: false,
    is_locked: false
  });
  const [newTopicData, setNewTopicData] = useState({ 
    title: '', 
    description: '',
    is_pinned: false,
    is_locked: false
  });

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/forum/categories/${category.category_id}/topics`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category.category_id]);

  const handleExpand = () => {
    setOpen(prev => {
      if (!prev) fetchTopics();
      return !prev;
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/forum/categories/${category.category_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      if (res.ok) {
        onUpdateCategory(category.category_id, { name: editName, description: editDesc });
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditName(category.name);
    setEditDesc(category.description || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this category and all its contents?')) return;
    try {
      const res = await fetch(`/forum/categories/${category.category_id}/full-delete`, {
        method: 'DELETE',
      });
      if (res.ok) onDeleteCategory(category.category_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTopic = async () => {
    const { title, description, is_pinned, is_locked } = newTopicData;
    if (!title || !currentUser?.id) return alert('Title is required and you must be logged in.');

    try {
      const res = await fetch('/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: category.category_id,
          creator_id: currentUser.id,
          title,
          description,
          is_pinned,
          is_locked
        }),
      });
      if (res.ok) {
        fetchTopics();
        setNewTopicData({ title: '', description: '', is_pinned: false, is_locked: false });
        setNewTopicOpen(false);
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('A network error occurred.');
    }
  };

  const handleTopicUpdate = async () => {
    const { topic_id, title, description, is_pinned, is_locked } = editTopicData;
    try {
      const res = await fetch(`/forum/topics/${topic_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, is_pinned, is_locked }),
      });
      if (res.ok) {
        setTopics(prev => prev.map(t => t.topic_id === topic_id ? { ...t, title, description, is_pinned, is_locked } : t));
        setEditTopicOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopicDelete = async (topic_id) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    try {
      const res = await fetch(`/forum/topics/${topic_id}`, { method: 'DELETE' });
      if (res.ok) setTopics(prev => prev.filter(t => t.topic_id !== topic_id));
    } catch (err) {
      console.error(err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  return (
    <>
      <TableRow
        sx={{
          bgcolor: 'white',
          borderLeft: `4px solid ${palette.accentPrimary}`,
          '&:hover': { bgcolor: palette.hoverLight },
          transition: 'background-color 0.2s ease'
        }}
      >
        <TableCell sx={{ width: '5%' }}>
          <IconButton 
            size="small" 
            onClick={handleExpand} 
            aria-label={open ? "Hide topics" : "Show topics"}
            sx={{ color: palette.accentPrimary }}
          >
            {open ? <FolderOpen /> : <Folder />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ color: palette.textPrimary, fontWeight: 500, width: '30%' }}>
          {isEditing ? (
            <TextField
              value={editName}
              onChange={e => setEditName(e.target.value)}
              size="small"
              autoFocus
              fullWidth
              sx={{ 
                '& .MuiInputBase-root': { 
                  borderRadius: '8px',
                  bgcolor: palette.backgroundLight
                } 
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Folder sx={{ color: palette.accentSecondary, fontSize: 20 }} />
              <span>{category.name}</span>
            </Box>
          )}
        </TableCell>
        <TableCell sx={{ color: palette.textSecondary, width: '50%' }}>
          {isEditing ? (
            <TextField
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              size="small"
              fullWidth
              sx={{ 
                '& .MuiInputBase-root': { 
                  borderRadius: '8px',
                  bgcolor: palette.backgroundLight
                } 
              }}
            />
          ) : (
            <Typography variant="body2" noWrap>
              {category.description || 'No description'}
            </Typography>
          )}
        </TableCell>
        <TableCell align="right" sx={{ width: '15%' }}>
          {isEditing ? (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              <Tooltip title="Save">
                <IconButton onClick={handleSave} size="small" sx={{ color: palette.success }}>
                  <Save fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton onClick={handleCancel} size="small" sx={{ color: palette.warning }}>
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              <Tooltip title="Edit category">
                <IconButton 
                  onClick={() => setIsEditing(true)} 
                  size="small" 
                  sx={{ color: palette.textSecondary }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete category">
                <IconButton 
                  onClick={handleDelete} 
                  size="small" 
                  sx={{ color: palette.error }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ 
              m: 1, 
              bgcolor: palette.backgroundLight, 
              borderRadius: 2, 
              p: 2,
              border: `1px solid ${palette.borderLight}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: palette.textPrimary, fontWeight: 500 }}>
                  <Topic sx={{ verticalAlign: 'middle', mr: 1, color: palette.accentSecondary }} />
                  Topics in category
                </Typography>
                <Button 
                  startIcon={<Add />} 
                  variant="outlined" 
                  onClick={() => setNewTopicOpen(true)}
                  sx={{ 
                    color: palette.accentPrimary, 
                    borderColor: palette.accentPrimary,
                    '&:hover': { 
                      bgcolor: `${palette.accentPrimary}15`, 
                      borderColor: palette.accentPrimary 
                    }
                  }}
                >
                  New topic
                </Button>
              </Stack>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={28} sx={{ color: palette.accentPrimary }} />
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: palette.backgroundMedium }}>
                        <TableCell sx={{ color: palette.textPrimary, fontWeight: 500 }}>Title</TableCell>
                        <TableCell sx={{ color: palette.textPrimary, fontWeight: 500 }}>Status</TableCell>
                        <TableCell sx={{ color: palette.textPrimary, fontWeight: 500 }}>Date</TableCell>
                        <TableCell sx={{ color: palette.textPrimary, fontWeight: 500 }}>Views</TableCell>
                        <TableCell align="right" sx={{ color: palette.textPrimary, fontWeight: 500 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topics.map(topic => (
                        <TableRow
                          key={topic.topic_id}
                          hover
                          sx={{ 
                            '&:hover': { bgcolor: palette.hoverLight },
                            '&:last-child td': { borderBottom: 0 }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500, color: palette.textPrimary }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Topic sx={{ color: palette.textSecondary, fontSize: 18 }} />
                              {topic.title}
                              {topic.is_pinned && (
                                <Tooltip title="Pinned">
                                  <PushPin fontSize="small" sx={{ color: palette.warning, ml: 1 }} />
                                </Tooltip>
                              )}
                              {topic.is_locked && (
                                <Tooltip title="Locked">
                                  <Lock fontSize="small" sx={{ color: palette.error }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ color: palette.textSecondary, ml: 4 }}>
                              {topic.description || 'No description'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
                              {topic.is_pinned && (
                                <Chip 
                                  label="Pinned" 
                                  size="small" 
                                  icon={<PushPin fontSize="small" />} 
                                  sx={{ bgcolor: `${palette.warning}20`, color: palette.warning }}
                                />
                              )}
                              {topic.is_locked && (
                                <Chip 
                                  label="Locked" 
                                  size="small" 
                                  icon={<Lock fontSize="small" />} 
                                  sx={{ bgcolor: `${palette.error}20`, color: palette.error }}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule fontSize="small" sx={{ color: palette.textSecondary }} />
                                {formatDate(topic.created_at)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                                Last activity: {formatDate(topic.last_activity)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Visibility fontSize="small" sx={{ color: palette.textSecondary }} />
                              <Typography>{topic.view_count}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Edit topic">
                                <IconButton
                                  onClick={() => {
                                    setEditTopicData(topic);
                                    setEditTopicOpen(true);
                                  }}
                                  size="small"
                                  sx={{ color: palette.textSecondary }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete topic">
                                <IconButton
                                  onClick={() => handleTopicDelete(topic.topic_id)}
                                  size="small"
                                  sx={{ color: palette.error }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {topics.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, color: palette.textSecondary }}>
                            <Description sx={{ fontSize: 40, color: palette.backgroundMedium, mb: 1 }} />
                            <Typography>No topics in this category</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* New Topic Modal */}
      <Dialog 
        open={newTopicOpen} 
        onClose={() => setNewTopicOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ 
          bgcolor: palette.accentPrimary, 
          color: 'white', 
          fontWeight: 500,
          py: 2
        }}>
          Add new topic
        </DialogTitle>
        <DialogContent sx={{ py: 3, bgcolor: palette.backgroundLight }}>
          <Stack spacing={2} sx={{ pt: 1, minWidth: 400 }}>
            <TextField
              fullWidth
              label="Topic title"
              margin="dense"
              value={newTopicData.title}
              onChange={e => setNewTopicData(prev => ({ ...prev, title: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
              required
            />
            <TextField
              fullWidth
              label="Topic description"
              margin="dense"
              value={newTopicData.description}
              onChange={e => setNewTopicData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newTopicData.is_pinned}
                    onChange={e => setNewTopicData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Pin topic"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newTopicData.is_locked}
                    onChange={e => setNewTopicData(prev => ({ ...prev, is_locked: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Lock topic"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ bgcolor: palette.backgroundLight, px: 3, py: 2 }}>
          <Button 
            onClick={() => setNewTopicOpen(false)} 
            variant="outlined"
            sx={{ 
              color: palette.textSecondary,
              borderColor: palette.borderLight,
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTopic} 
            variant="contained" 
            sx={{ 
              bgcolor: palette.accentPrimary,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { bgcolor: palette.accentSecondary, boxShadow: 'none' }
            }}
          >
            Save topic
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Topic Modal */}
      <Dialog 
        open={editTopicOpen} 
        onClose={() => setEditTopicOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ 
          bgcolor: palette.accentPrimary, 
          color: 'white', 
          fontWeight: 500,
          py: 2
        }}>
          Edit topic
        </DialogTitle>
        <DialogContent sx={{ py: 3, bgcolor: palette.backgroundLight }}>
          <Stack spacing={2} sx={{ pt: 1, minWidth: 400 }}>
            <TextField
              fullWidth
              label="Topic title"
              margin="dense"
              value={editTopicData.title || ''}
              onChange={e => setEditTopicData(prev => ({ ...prev, title: e.target.value }))}
              InputProps={{ sx: { borderRadius: 2 } }}
              required
            />
            <TextField
              fullWidth
              label="Topic description"
              margin="dense"
              value={editTopicData.description || ''}
              onChange={e => setEditTopicData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editTopicData.is_pinned || false}
                    onChange={e => setEditTopicData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Pin topic"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editTopicData.is_locked || false}
                    onChange={e => setEditTopicData(prev => ({ ...prev, is_locked: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Lock topic"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ bgcolor: palette.backgroundLight, px: 3, py: 2 }}>
          <Button 
            onClick={() => setEditTopicOpen(false)} 
            variant="outlined"
            sx={{ 
              color: palette.textSecondary,
              borderColor: palette.borderLight,
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTopicUpdate} 
            variant="contained" 
            sx={{ 
              bgcolor: palette.accentPrimary,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { bgcolor: palette.accentSecondary, boxShadow: 'none' }
            }}
          >
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

Row.propTypes = {
  category: PropTypes.object.isRequired,
  onUpdateCategory: PropTypes.func.isRequired,
  onDeleteCategory: PropTypes.func.isRequired,
};

export default function ForumCategoryTable() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/forum/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/forum/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories(prev => [...prev, { ...cat, topics: [] }]);
        setNewName('');
        setNewDesc('');
      } else {
        const err = await res.json();
        alert(`Error adding category: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = useCallback((id, updates) => {
    setCategories(prev => prev.map(c => c.category_id === id ? { ...c, ...updates } : c));
  }, []);

  const handleDelete = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.category_id !== id));
  }, []);

  return (
    <Box sx={{ 
      bgcolor: palette.backgroundLight, 
      p: 3, 
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="h6" sx={{ 
        color: palette.textPrimary, 
        fontWeight: 600, 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Folder sx={{ color: palette.accentSecondary }} /> Forum Category Management
      </Typography>

      <Box sx={{ 
        bgcolor: 'white', 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="subtitle1" sx={{ color: palette.textPrimary, mb: 2, fontWeight: 500 }}>
          Add new category
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }}>
          <TextField
            label="Category name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <TextField
            label="Category description"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            size="small"
            sx={{ flex: 2 }}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <Button 
            variant="contained" 
            onClick={handleAdd} 
            sx={{ 
              bgcolor: palette.accentPrimary,
              color: 'white',
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: palette.accentSecondary }
            }}
          >
            Add
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 300,
          bgcolor: 'white',
          borderRadius: 3
        }}>
          <Fade in={true} style={{ transitionDelay: '200ms' }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={50} sx={{ color: palette.accentPrimary }} />
              <Typography variant="body1" sx={{ color: palette.textSecondary }}>
                Loading categories...
              </Typography>
            </Stack>
          </Fade>
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: palette.backgroundMedium }}>
              <TableRow>
                <TableCell sx={{ width: '5%' }}></TableCell>
                <TableCell sx={{ color: palette.textPrimary, fontWeight: 600, width: '30%' }}>Name</TableCell>
                <TableCell sx={{ color: palette.textPrimary, fontWeight: 600, width: '50%' }}>Description</TableCell>
                <TableCell align="right" sx={{ color: palette.textPrimary, fontWeight: 600, width: '15%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map(cat => (
                <Row
                  key={cat.category_id}
                  category={cat}
                  onUpdateCategory={handleUpdate}
                  onDeleteCategory={handleDelete}
                />
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <FolderOpen sx={{ fontSize: 60, color: palette.backgroundMedium, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: palette.textSecondary, fontWeight: 400 }}>
                      No categories available
                    </Typography>
                    <Typography variant="body2" sx={{ color: palette.textSecondary, mt: 1 }}>
                      Add a new category using the form above
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}