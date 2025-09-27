// src/scenes/subscriptions/SubscriptionsManager.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Tabs, Tab, Stack, Typography, Button, TextField, Chip } from "@mui/material";
import { notifySuccess, notifyError } from "../../services/notification/toast.service";
import { countFollowed, listSubscriptions, bulkSubscribeFromFilters, subscribeOne, unsubscribeOne } from "../../services/business/subscriptions/subscriptions.service";

const SubscriptionsManager: React.FC = () => {
  const [tab, setTab] = useState<"followed" | "explore">("followed");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    countFollowed().then(setCount).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "followed") {
      listSubscriptions(page, 50).then((p) => setItems(p.content));
    }
  }, [tab, page]);

  const onSubscribe = async (personId: number) => {
    try {
      await subscribeOne(personId);
      notifySuccess("Abonné !");
      setCount((c) => c + 1);   
    } catch (e) {
      notifyError("Échec de l’abonnement.");
    }
  };

  const onUnsubscribe = async (personId: number) => {
    try {
      await unsubscribeOne(personId);
      notifySuccess("Désabonné.");
      setItems((lst) => lst.filter((x) => x.personId !== personId));
      setCount((c) => Math.max(0, c - 1));
    } catch (e) {
      notifyError("Échec du désabonnement.");
    }
  };

  const onSubscribeFromFilters = async (filters: any) => {
    try {
      const res = await bulkSubscribeFromFilters(filters);
      notifySuccess(`Ajoutés: ${res.inserted} (déjà suivis: ${res.alreadyExisting})`);
      setCount((c) => c + res.inserted);
    } catch {
      notifyError("Import depuis filtres impossible.");
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h5">Mes suivis</Typography>
        <Chip label={`${count} suivis`} />
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab value="followed" label="Suivis" />
        <Tab value="explore" label="Explorer" />
      </Tabs>

      {tab === "followed" && (
        <Stack spacing={1}>
          {items.map((s) => (
            <Stack key={`${s.userId}-${s.personId}`} direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)" }}>
              <Typography>Person #{s.personId}</Typography>
              <Button size="small" variant="outlined" onClick={() => onUnsubscribe(s.personId)}>Se désabonner</Button>
            </Stack>
          ))}
        </Stack>
      )}

      {tab === "explore" && (
        <Stack spacing={2}>
          <TextField placeholder="Rechercher une personne…" size="small" />
          {/* Place ici ta InlineFiltersBar existante */}
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => onSubscribeFromFilters({ /* ton ChallengeMenuDto */ })}>
              Suivre tous les résultats
            </Button>
          </Stack>
          {/* Liste des résultats d’exploration avec bouton “Suivre” → onSubscribe(personId) */}
        </Stack>
      )}
    </Stack>
  );
};

export default SubscriptionsManager;
