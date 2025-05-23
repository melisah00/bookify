import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bottom: 0,
        left: 0,
        width: '100%',
        py: 2,
        textAlign: "center",
        backgroundColor: '#f8f9fa',
        color: "rgb(78, 121, 107)",
        borderTop: "1px solid rgb(167, 215, 184)",
        boxShadow: "0 -1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} <strong>Bookify </strong>. All rights reserved.
      </Typography>
    </Box>
  );
}