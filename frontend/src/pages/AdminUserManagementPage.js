import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Button,
  Box,
  Pagination,
  Avatar,
  Chip,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EditUserRoleDialog from "../components/EditUserRoleDialog";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import AdminUserFilter from "../components/AdminUserFilter";

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    username: "",
    email: "",
    roles: [],
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", rowsPerPage);
      if (filters.username) params.append("username", filters.username);
      if (filters.email) params.append("email", filters.email);
      filters.roles.forEach((role) => params.append("roles", role));

      const res = await fetch(
        `http://localhost:8000/users/admin/users?${params.toString()}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();

      setUsers(data.users || []);
      const calculatedPages = Math.ceil((data.total_count || 0) / rowsPerPage);
      setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterSubmit = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1); // reset page on filter change
  }, []);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditOpen(true);
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  if (isLoading) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography align="center" variant="h6" color="text.secondary">
          Loading users...
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 6, pb: 6 }}>
      <Typography
        variant="h4"
        align="center"
        sx={{
          mb: 4,
          color: "#4e796b",
          fontWeight: "bold",
          borderBottom: "3px solid #66b2a0",
          display: "inline-block",
          px: 2,
        }}
      >
        User Management
      </Typography>

      <AdminUserFilter onSubmit={handleFilterSubmit} />

      {users.length === 0 ? (
        <Typography align="center" sx={{ mt: 4 }}>
          No users found.
        </Typography>
      ) : (
        <>
          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>User</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Email</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Role</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            src={
                              user.icon
                                ? `http://localhost:8000${user.icon}`
                                : undefined
                            }
                            alt={user.username}
                            sx={{ bgcolor: "#66b2a0" }}
                          >
                            {!user.icon &&
                              (user.username?.[0]?.toUpperCase() || "U")}
                          </Avatar>
                          <Typography variant="body1">
                            {user.username}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.roles?.[0] || "unknown"}
                          sx={{ backgroundColor: "#e0f2f1", color: "#00695c" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => openEditDialog(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => openDeleteDialog(user)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="medium"
            />
          </Box>
        </>
      )}

      {selectedUser && (
        <>
          <EditUserRoleDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            user={selectedUser}
            onSuccess={() => {
              setEditOpen(false);
              fetchUsers();
            }}
          />
          <ConfirmDeleteDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            user={selectedUser}
            onSuccess={() => {
              setDeleteOpen(false);
              fetchUsers();
            }}
          />
        </>
      )}
    </Container>
  );
};

export default AdminUserManagementPage;
