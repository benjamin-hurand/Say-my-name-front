// src/contexts/PersonsDirectoryContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Page, listFollowedPersonIds, subscribeOne, unsubscribeOne } from "../services/business/subscriptions/subscriptions.service";
import { PersonCardDto } from "../services/dto/person/search/PersonCardDtos";
import { PersonSearchRequestDto } from "../services/dto/person/search/PersonSearchRequestDto";
import { searchPersons } from "../services/business/persons/person.service";

/** État "annulé/remplacé" basique pour éviter les races sur les requêtes en vol */
let seqGlobal = 0;

/** Clé de cache basée sur le body + taille de page */
function makeSearchKey(body: PersonSearchRequestDto | undefined, size: number) {
  return JSON.stringify({ body: body ?? {}, size });
}

type CachePerPage = Map<number, Page<PersonCardDto>>;

type PersonsDirectoryState = {
  loading: boolean;
  error: string | null;

  /** Derniers critères et pagination */
  lastBody?: PersonSearchRequestDto;
  pageSize: number;
  currentPage: number;

  /** Données de la page courante */
  page?: Page<PersonCardDto>;
  items: PersonCardDto[];
  totalPages: number;
  totalElements: number;

  /** Suivis */
  followedIds: Set<number>;
  followedLoading: boolean;
};

type PersonsDirectoryActions = {
  /** Lance une recherche (réinitialise en page 0 par défaut) */
  search: (body: PersonSearchRequestDto, page?: number, size?: number) => Promise<void>;

  /** Va à une page (en réutilisant lastBody) */
  goto: (page: number) => Promise<void>;

  /** Relance la dernière recherche (utile après follow/unfollow, etc.) */
  refresh: () => Promise<void>;

  /** Met à jour la taille de page et recharge */
  setPageSize: (size: number) => Promise<void>;

  /** Abonnements */
  refreshFollowed: () => Promise<void>;
  follow: (personId: number) => Promise<void>;
  unfollow: (personId: number) => Promise<void>;

  /** Helpers */
  isFollowed: (personId: number) => boolean;
};

type PersonsDirectoryContextType = PersonsDirectoryState & PersonsDirectoryActions;

const CTX = createContext<PersonsDirectoryContextType | undefined>(undefined);

export const PersonsDirectoryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // ---- State principal ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastBody, setLastBody] = useState<PersonSearchRequestDto | undefined>(undefined);
  const [pageSize, setPageSizeState] = useState<number>(24);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [page, setPage] = useState<Page<PersonCardDto> | undefined>(undefined);

  // ---- Cache : par (key = body+size) => Map<pageNumber, Page> ----
  const cacheRef = useRef<Map<string, CachePerPage>>(new Map());

  // ---- Suivis ----
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [followedLoading, setFollowedLoading] = useState(false);

  const items = useMemo(() => page?.content ?? [], [page]);
  const totalPages = page?.totalPages ?? 0;
  const totalElements = page?.totalElements ?? 0;

  const isFollowed = useCallback((pid: number) => followedIds.has(pid), [followedIds]);

  const fillFromCache = useCallback((key: string, pageNumber: number): Page<PersonCardDto> | undefined => {
    const byPage = cacheRef.current.get(key);
    return byPage?.get(pageNumber);
  }, []);

  const writeCache = useCallback((key: string, pageNumber: number, value: Page<PersonCardDto>) => {
    let byPage = cacheRef.current.get(key);
    if (!byPage) {
      byPage = new Map<number, Page<PersonCardDto>>();
      cacheRef.current.set(key, byPage);
    }
    byPage.set(pageNumber, value);
  }, []);

  const doSearch = useCallback(
    async (body: PersonSearchRequestDto, pageNumber: number, size: number) => {
      setLoading(true);
      setError(null);
      const mySeq = ++seqGlobal;

      const key = makeSearchKey(body, size);
      const cached = fillFromCache(key, pageNumber);
      if (cached) {
        setPage(cached);
        setLastBody(body);
        setCurrentPage(pageNumber);
        setLoading(false);
        return;
      }

      try {
        const result = await searchPersons(body, pageNumber, size);
        if (mySeq !== seqGlobal) return; // une autre requête a pris le dessus

        writeCache(key, pageNumber, result);
        setPage(result);
        setLastBody(body);
        setCurrentPage(pageNumber);
      } catch (e: any) {
        if (mySeq !== seqGlobal) return;
        setError(e?.message ?? "Erreur de recherche");
      } finally {
        if (mySeq === seqGlobal) setLoading(false);
      }
    },
    [fillFromCache, writeCache]
  );

  const search = useCallback<PersonsDirectoryActions["search"]>(
    async (body, page = 0, size = pageSize) => {
      // reset de pagination si on change de body/size
      if (size !== pageSize) setPageSizeState(size);
      await doSearch(body, page, size);
    },
    [doSearch, pageSize]
  );

  const goto = useCallback<PersonsDirectoryActions["goto"]>(async (pageNumber) => {
    if (!lastBody) return;
    await doSearch(lastBody, pageNumber, pageSize);
  }, [doSearch, lastBody, pageSize]);

  const refresh = useCallback<PersonsDirectoryActions["refresh"]>(async () => {
    if (!lastBody) return;
    // on ne purge pas le cache global pour conserver la navigation fluide
    await doSearch(lastBody, currentPage, pageSize);
  }, [doSearch, lastBody, currentPage, pageSize]);

  const setPageSize = useCallback<PersonsDirectoryActions["setPageSize"]>(async (size) => {
    if (!lastBody) {
      setPageSizeState(size);
      return;
    }
    // On change la taille => on repart page 0
    setPageSizeState(size);
    await doSearch(lastBody, 0, size);
  }, [doSearch, lastBody]);

  // ---- Suivis (pagination côté API -> on récupère tout) ----
  const refreshFollowed = useCallback(async () => {
    setFollowedLoading(true);
    try {
      let pageIdx = 0;
      const size = 200;
      const acc: number[] = [];
      // boucle simple pour rapatrier toutes les pages
      // (ton API renvoie Page<number>)
      // on s'arrête quand on a tout.
      // NB: côté perf, 1000 ids = OK.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const p = await listFollowedPersonIds(pageIdx, size);
        acc.push(...p.content);
        if (pageIdx + 1 >= p.totalPages) break;
        pageIdx++;
      }
      setFollowedIds(new Set(acc));
    } catch (e) {
      // si erreur, on ne jette pas l’état courant
      // (logging éventuel)
      // console.error(e);
    } finally {
      setFollowedLoading(false);
    }
  }, []);

  const follow = useCallback<PersonsDirectoryActions["follow"]>(async (personId) => {
    // Optimiste
    setFollowedIds(prev => {
      const next = new Set(prev);
      next.add(personId);
      return next;
    });
    try {
      await subscribeOne(personId);
      // Optionnel : rafraîchir la page courante pour refléter `followed` serveur
      // await refresh();
    } catch (e) {
      // rollback
      setFollowedIds(prev => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
      throw e;
    }
  }, []);

  const unfollow = useCallback<PersonsDirectoryActions["unfollow"]>(async (personId) => {
    // Optimiste
    setFollowedIds(prev => {
      const next = new Set(prev);
      next.delete(personId);
      return next;
    });
    try {
      await unsubscribeOne(personId);
      // Optionnel : await refresh();
    } catch (e) {
      // rollback
      setFollowedIds(prev => new Set(prev).add(personId));
      throw e;
    }
  }, []);

  const value = useMemo<PersonsDirectoryContextType>(() => ({
    // state
    loading,
    error,
    lastBody,
    pageSize,
    currentPage,
    page,
    items,
    totalPages,
    totalElements,
    followedIds,
    followedLoading,

    // actions
    search,
    goto,
    refresh,
    setPageSize,
    refreshFollowed,
    follow,
    unfollow,
    isFollowed,
  }), [
    loading, error, lastBody, pageSize, currentPage, page, items, totalPages, totalElements,
    followedIds, followedLoading,
    search, goto, refresh, setPageSize, refreshFollowed, follow, unfollow, isFollowed
  ]);

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
};

export function usePersonsDirectory() {
  const ctx = useContext(CTX);
  if (!ctx) throw new Error("usePersonsDirectory must be used within a PersonsDirectoryProvider");
  return ctx;
}
