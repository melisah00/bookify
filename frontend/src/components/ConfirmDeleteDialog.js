import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme,
} from "@mui/material";

const ConfirmDeleteDialog = ({ open, onClose, user, onSuccess }) => {
  const theme = useTheme();

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:8000/users/admin/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete user");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
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
        Delete User
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "#4e796b" }}>
          Are you sure you want to delete user <strong>{user?.username}</strong>
          ?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "flex-end", mt: 3 }}>
        <Button onClick={onClose} sx={{ color: "#4e796b", fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          sx={{
            fontWeight: 700,
            boxShadow:
              "0 4px 12px rgba(220, 53, 69, 0.5), 0 0 20px rgba(220, 53, 69, 0.3)",
            "&:hover": {
              boxShadow:
                "0 6px 15px rgba(165, 39, 48, 0.7), 0 0 30px rgba(220, 53, 69, 0.5)",
            },
            transition: "all 0.3s ease",
            minWidth: 100,
            borderRadius: 3,
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
