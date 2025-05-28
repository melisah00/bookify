import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";

export default function EditProfileDialog({ open, onClose, user, onSave }) {
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    date_of_birth: user.date_of_birth || "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    await onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ bgcolor: "#f8f9fa", p: 2, borderRadius: 2 }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6">Edit Personal Information</Typography>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              p: 3,
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: "text.secondary", mb: 2 }}
            >
              Basic Info
            </Typography>
            <Stack spacing={2}>
              <TextField
                name="first_name"
                label="First Name"
                placeholder={user.first_name}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                name="last_name"
                label="Last Name"
                placeholder={form.last_name}
                onChange={handleChange}
                fullWidth
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="subtitle2"
              sx={{ color: "text.secondary", mb: 2 }}
            >
              Contact & Other
            </Typography>
            <Stack spacing={2}>
              <TextField
                name="email"
                label="Email"
                type="email"
                placeholder={form.email}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                name="date_of_birth"
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: "#66b2a0",
              "&:hover": { backgroundColor: "#579b8a" },
              textTransform: "none",
              px: 3,
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
