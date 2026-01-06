// src/scenes/admin/dashboard/AdminHome.tsx
import { useEffect } from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Skeleton,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAdminData } from "../../../contexts/AdminDataContext";
import AdminPendingCRsCard from "./components/AdminPendingCRsCard";

export default function AdminHome() {
  const { kpis, refreshKpis } = useAdminData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!kpis) {
      refreshKpis();
    }
  }, [kpis, refreshKpis]);

  if (!kpis) {
    return <Skeleton variant="rounded" height={120} />;
  }

  const cards = [
    { label: "Persons", value: kpis.persons },
    { label: "Attributes", value: kpis.attributes },
  ];

  return (
    <Grid container spacing={1.5}>
      {cards.map((c) => (
        <Grid item xs={12} md={4} key={c.label}>
          <Card>
            <CardContent>
              <Typography variant="overline">{c.label}</Typography>
              <Typography variant="h4">{c.value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12} md={8}>
        <AdminPendingCRsCard />
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardActionArea onClick={() => navigate("/admin/members")}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="overline">
                  Members & invitations
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Consultez les membres de l’espace et gérez les liens
                  d’inscription (groupe ou nominatif).
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ alignSelf: "flex-start", mt: 0.5 }}
                >
                  Ouvrir la gestion des membres
                </Button>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    </Grid>
  );
}
