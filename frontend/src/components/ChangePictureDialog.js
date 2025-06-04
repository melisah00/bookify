import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Typography,
  Box,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import palette from "../theme/palette";

export default function ChangePictureDialog({
  open,
  onClose,
  onUpload,
  currentAvatar,
}) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file);
      onClose();
      setFile(null);
      setPreview(null);
    }
  };

  const handleCancel = () => {
    onClose();
    setFile(null);
    setPreview(null);
  };

  const avatarSrc = preview || currentAvatar || undefined;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 2,
          bgcolor: palette.backgroundLight,
          width: "100%",
          maxWidth: 420,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: palette.textDark }}>
        Upload New Profile Picture
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
            mt: 1,
          }}
        >
          <Avatar
            src={avatarSrc}
            sx={{
              width: 100,
              height: 100,
              bgcolor: "#66b2a0",
              fontSize: 36,
              boxShadow: 3,
            }}
          />

          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            sx={{
              mt: 1,
              borderColor: palette.accentMedium,
              color: palette.accentMedium,
              fontWeight: 600,
              "&:hover": {
                bgcolor: "rgba(102,178,160,0.08)",
                borderColor: palette.accentMedium,
              },
            }}
          >
            Choose Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
          </Button>

          <Typography variant="caption" sx={{ color: palette.textDark, mt: 1 }}>
            Preview shown above
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        <Button
          onClick={handleCancel}
          sx={{
            color: palette.textDark,
            fontWeight: 600,
            "&:hover": {
              bgcolor: "rgba(0,0,0,0.04)",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file}
          sx={{
            bgcolor: palette.accentMedium,
            fontWeight: 600,
            color: palette.backgroundLight,
            "&:hover": {
              bgcolor: "rgb(80, 160, 140)",
            },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
