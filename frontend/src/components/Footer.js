import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        bottom: 0,
        left: 0,
        width: '100%',
        py: 2,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        textAlign: "center",
        backgroundColor: "rgb(102,178,160)",
        color: "#ffff",
        borderTop: "1px solid #B0C4B1",
      }}
    >
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} <strong>Bookify </strong>. All rights reserved.
      </Typography>
    </Box>
  );
}