import React from "react";
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../contexts/AuthContext";
import EditProfileDialog from "./EditProfileDialog";
import ChangePictureDialog from "./ChangePictureDialog";

export default function Profile() {
  const { user, loading } = useAuth();
  const [editOpen, setEditOpen] = React.useState(false);
  const [pictureDialogOpen, setPictureDialogOpen] = React.useState(false);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Typography variant="h6" sx={{ mt: 6, textAlign: "center" }}>
        Could not load user info.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 6, mb: 4 }}>
      <Card
        sx={{
          maxWidth: 600,
          width: "100%",
          p: 3,
          borderRadius: 4,
          boxShadow: 4,
        }}
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Avatar
              src={user.icon || undefined}
              sx={{ width: 80, height: 80, bgcolor: "#66b2a0", fontSize: 32 }}
            >
              {user.first_name?.[0]}
              {user.last_name?.[0]}
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

          <Box
            sx={{
              p: 2,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Personal Information
            </Typography>

            <Stack spacing={2}>
              <InfoRow label="First Name" value={user.first_name} />
              <InfoRow label="Last Name" value={user.last_name} />
              <InfoRow label="Username" value={user.username} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow
                label="Date of Birth"
                value={user.date_of_birth || "Not specified"}
              />
              <InfoRow
                label="Age"
                value={
                  user.date_of_birth
                    ? calculateAge(user.date_of_birth) + " years"
                    : "Not specified"
                }
              />
            </Stack>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                pt: 1,
                borderTop: "1px solid #f0f0f0",
                marginTop: "auto",
              }}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setEditOpen(true)}
                sx={{ mt: 1 }}
              >
                Edit Personal Info
              </Button>
            </Box>
          </Box>

          <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Profile Picture
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Avatar
                src={user.icon || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "#66b2a0",
                  fontSize: 32,
                  flexShrink: 0,
                }}
              >
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </Avatar>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  alignItems: "flex-start",
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setPictureDialogOpen(true)}
                >
                  Change Picture
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={handleDeleteAvatar}
                >
                  Delete Picture
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSave={async (formData) => {
          const finalData = {
            first_name: formData.first_name || user.first_name,
            last_name: formData.last_name || user.last_name,
            email: formData.email || user.email,
            date_of_birth: formData.date_of_birth || user.date_of_birth,
          };

          try {
            await fetch("http://localhost:8000/users/profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(finalData),
            });
            window.location.reload();
          } catch (err) {
            console.error("Error updating profile:", err);
          }
        }}
      />
      <ChangePictureDialog
        open={pictureDialogOpen}
        onClose={() => setPictureDialogOpen(false)}
        onUpload={handleUploadAvatar}
        currentAvatar={user.icon}
      />
    </Box>
  );
}

function InfoRow({ label, value, onEdit }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">{value}</Typography>
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
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const handleUploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://localhost:8000/users/avatar", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload avatar.");
    }

    window.location.reload();
  } catch (err) {
    console.error("Avatar upload failed:", err);
  }
};

const handleDeleteAvatar = async () => {
  try {
    const res = await fetch("http://localhost:8000/users/avatar", {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to delete avatar.");
    }

    window.location.reload();
  } catch (err) {
    console.error("Avatar delete failed:", err);
  }
};
