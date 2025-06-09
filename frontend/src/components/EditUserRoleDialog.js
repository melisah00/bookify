import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  Box,
  useTheme,
} from "@mui/material";

const EditUserRoleDialog = ({ open, onClose, user, onSuccess }) => {
  const [selectedRole, setSelectedRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (user) setSelectedRole(user.roles?.[0] || "");
  }, [user]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("http://localhost:8000/users/roles", {
          credentials: "include",
        });
        const data = await res.json();

        let rolesArr = [];
        if (Array.isArray(data)) rolesArr = data;
        else if (Array.isArray(data.roles)) rolesArr = data.roles;
        else {
          rolesArr = [];
          console.error("Invalid roles format:", data);
        }

        // Explicit order
        const desiredOrder = [
          "admin",
          "author",
          "reader",
          "forum_admin",
          "forum_moderator",
        ];
        rolesArr.sort(
          (a, b) => desiredOrder.indexOf(a) - desiredOrder.indexOf(b)
        );

        setRoles(rolesArr);
      } catch (err) {
        console.error("Failed to fetch roles", err);
        setRoles([]);
      }
    };
    if (open) fetchRoles();
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/users/admin/${user.id}/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: selectedRole }),
        }
      );

      if (!res.ok) throw new Error("Failed to update role");

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 4,
          padding: 3,
          backgroundColor: theme.palette.background.paper,
          boxShadow:
            "0px 4px 10px rgba(100, 179, 160, 0.2), 0px 0px 15px rgba(78, 121, 107, 0.1)",
          transition: "all 0.3s ease-in-out",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#4e796b",
          fontWeight: 700,
          fontSize: "1.4rem",
          pb: 1.5,
          mb: 2,
        }}
      >
        Edit Role for {user?.username}
      </DialogTitle>

      <DialogContent>
        {roles.length === 0 ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress size={30} sx={{ color: "#66b2a0" }} />
          </Box>
        ) : (
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel sx={{ color: "#4e796b" }}>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={(e) => setSelectedRole(e.target.value)}
              sx={{
                borderRadius: 3,
                color: "#4e796b",
                fontWeight: 600,
                "& fieldset": { borderColor: "#66b2a0" },
                "&:hover fieldset": { borderColor: "#4e796b" },
                "&.Mui-focused fieldset": { borderColor: "#66b2a0" },
                transition: "border-color 0.3s ease",
              }}
            >
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "flex-end", mt: 3 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ color: "#4e796b", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !selectedRole}
          sx={{
            backgroundColor: "#66b2a0",
            color: "#fff",
            borderRadius: 3,
            minWidth: 100,
            fontWeight: 700,
            boxShadow:
              "0 4px 12px rgba(102, 178, 160, 0.5), 0 0 20px rgba(78, 121, 107, 0.3)",
            "&:hover": {
              backgroundColor: "#4e796b",
              boxShadow:
                "0 6px 15px rgba(78, 121, 107, 0.7), 0 0 30px rgba(102, 178, 160, 0.5)",
            },
            transition: "all 0.3s ease",
          }}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "white" }} />
          ) : (
            "Save"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserRoleDialog;
