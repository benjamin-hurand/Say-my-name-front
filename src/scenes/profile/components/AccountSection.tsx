import React from "react";
import {
  Card, CardContent, Typography, Box, Button,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { useProfile } from "../../../contexts/ProfileContext";
import ChangePasswordDialog from "./ChangePasswordDialog";

const AccountSection: React.FC = () => {
  const { user } = useProfile();
  const username = user?.username ?? "Moi";
  const email = user?.email ?? "";

  const [openPwd, setOpenPwd] = React.useState(false);

  return (
    <>
      <Card
        variant="outlined"
        sx={{ backdropFilter: "blur(12px)", bgcolor: "rgba(32,32,32,0.7)", flex: "0 0 auto" }}
      >
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              Mon Compte
            </Typography>
          </Box>
          <Typography><strong>Username :</strong> {username}</Typography>
          <Typography><strong>Email :</strong> {email}</Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setOpenPwd(true)}
            >
              Changer le mot de passe
            </Button>
          </Box>
        </CardContent>
      </Card>

      <ChangePasswordDialog open={openPwd} onClose={() => setOpenPwd(false)} />
    </>
  );
};

export default AccountSection;
