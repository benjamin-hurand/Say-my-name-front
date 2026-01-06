// src/contexts/PersonsDirectoryContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Page,
  listFollowedPersonIds,
  subscribeOne,
  unsubscribeOne,
} from "../services/business/subscriptions/subscriptions.service";
import { PersonCardDto } from "../services/dto/person/search/PersonCardDtos";
import { PersonSearchRequestDto } from "../services/dto/person/search/PersonSearchRequestDto";
import {
  DirectoryDataSource,
  userDataSource,
} from "./personsDirectory.dataSource";

// --- Cache partagé module-scope (persiste pour toutes les pages) ---
type CachePerPage = Map<number, Page<PersonCardDto>>;
const globalCache: Map<string, CachePerPage> = new Map();

// clé de cache: inclure la source pour éviter les collisions
function makeCacheKey(
  source: DirectoryDataSource,
  body: PersonSearchRequestDto | undefined,
  size: number
) {
  return JSON.stringify({ src: source.name, body: body ?? {}, size });
}

// Séquence anti-race partagée
let seqGlobal = 0;

// ---------- TYPES EXPLICITES (important !) ----------
export type PersonsDirectoryState = {
  loading: boolean;
  error: string | null;

  lastBody?: PersonSearchRequestDto;
  pageSize: number;
  currentPage: number;

  page?: Page<PersonCardDto>;
  items: PersonCardDto[];
  totalPages: number;
  totalElements: number;

  followedIds: Set<number>;
  followedLoading: boolean;
};

export type PersonsDirectoryActions = {
  search: (
    body: PersonSearchRequestDto,
    page?: number,
    size?: number
  ) => Promise<void>;
  goto: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  setPageSize: (size: number) => Promise<void>;

  refreshFollowed: () => Promise<void>;
  follow: (personId: number) => Promise<void>;
  unfollow: (personId: number) => Promise<void>;

  isFollowed: (personId: number) => boolean;
};

type PersonsDirectoryContextType = PersonsDirectoryState & PersonsDirectoryActions;

const CTX = createContext<PersonsDirectoryContextType | undefined>(undefined);

export const PersonsDirectoryProvider: React.FC<
  React.PropsWithChildren<{ dataSource?: DirectoryDataSource }>
> = ({ children, dataSource = userDataSource }) => {
  // ---- State principal ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastBody, setLastBody] = useState<PersonSearchRequestDto | undefined>(
    undefined
  );
  const [pageSize, setPageSizeState] = useState<number>(24);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [page, setPage] = useState<Page<PersonCardDto>>();

  const items = useMemo(() => page?.content ?? [], [page]);
  const totalPages = page?.totalPages ?? 0;
  const totalElements = page?.totalElements ?? 0;

  // ---- Suivis ----
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [followedLoading, setFollowedLoading] = useState(false);
  const isFollowed = useCallback((pid: number) => followedIds.has(pid), [followedIds]);

  // ---- Cache helpers ----
  const fillFromCache = useCallback(
    (key: string, pageNumber: number): Page<PersonCardDto> | undefined => {
      const byPage = globalCache.get(key);
      return byPage?.get(pageNumber);
    },
    []
  );

  const writeCache = useCallback(
    (key: string, pageNumber: number, value: Page<PersonCardDto>) => {
      let byPage = globalCache.get(key);
      if (!byPage) {
        byPage = new Map<number, Page<PersonCardDto>>();
        globalCache.set(key, byPage);
      }
      byPage.set(pageNumber, value);
    },
    []
  );

  const doSearch = useCallback(
    async (body: PersonSearchRequestDto, pageNumber: number, size: number) => {
      setLoading(true);
      setError(null);
      const mySeq = ++seqGlobal;

      const key = makeCacheKey(dataSource, body, size);
      const cached = fillFromCache(key, pageNumber);
      if (cached) {
        setPage(cached);
        setLastBody(body);
        setCurrentPage(pageNumber);
        setLoading(false);
        return;
      }

      try {
        const result = await dataSource.search(body, pageNumber, size);
        if (mySeq !== seqGlobal) return;

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
    [dataSource, fillFromCache, writeCache]
  );

  const search = useCallback(
    async (body: PersonSearchRequestDto, pageNum = 0, size = pageSize) => {
      if (size !== pageSize) setPageSizeState(size);
      await doSearch(body, pageNum, size);
    },
    [doSearch, pageSize]
  );

  const goto = useCallback(
    async (pageNum: number) => {
      if (!lastBody) return;
      await doSearch(lastBody, pageNum, pageSize);
    },
    [doSearch, lastBody, pageSize]
  );

  const refresh = useCallback(async () => {
    if (!lastBody) return;
    await doSearch(lastBody, currentPage, pageSize);
  }, [doSearch, lastBody, currentPage, pageSize]);

  const setPageSize = useCallback(
    async (size: number) => {
      if (!lastBody) {
        setPageSizeState(size);
        return;
      }
      setPageSizeState(size);
      await doSearch(lastBody, 0, size);
    },
    [doSearch, lastBody]
  );

  // ---- Suivis (user uniquement) ----
  const refreshFollowed = useCallback(async () => {
    if (!dataSource.supportsFollow) return; // no-op en admin
    setFollowedLoading(true);
    try {
      let pageIdx = 0;
      const size = 200;
      const acc: number[] = [];
      // rapatrier toutes les pages d'IDs suivis
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const p = await listFollowedPersonIds(pageIdx, size);
        acc.push(...p.content);
        if (pageIdx + 1 >= p.totalPages) break;
        pageIdx++;
      }
      setFollowedIds(new Set(acc));
    } finally {
      setFollowedLoading(false);
    }
  }, [dataSource.supportsFollow]);

  const follow = useCallback(
    async (personId: number) => {
      if (!dataSource.supportsFollow) return;
      // Optimiste
      setFollowedIds((prev) => new Set(prev).add(personId));
      try {
        await subscribeOne(personId);
      } catch {
        // rollback
        setFollowedIds((prev) => {
          const next = new Set(prev);
          next.delete(personId);
          return next;
        });
        throw new Error("subscribe failed");
      }
    },
    [dataSource.supportsFollow]
  );

  const unfollow = useCallback(
    async (personId: number) => {
      if (!dataSource.supportsFollow) return;
      // Optimiste
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
      try {
        await unsubscribeOne(personId);
      } catch {
        // rollback
        setFollowedIds((prev) => new Set(prev).add(personId));
        throw new Error("unsubscribe failed");
      }
    },
    [dataSource.supportsFollow]
  );

  const value: PersonsDirectoryContextType = useMemo(
    () => ({
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
    }),
    [
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
      search,
      goto,
      refresh,
      setPageSize,
      refreshFollowed,
      follow,
      unfollow,
      isFollowed,
    ]
  );

  return <CTX.Provider value={value}>{children}</CTX.Provider>;
};

export function usePersonsDirectory() {
  const ctx = useContext(CTX);
  if (!ctx)
    throw new Error(
      "usePersonsDirectory must be used within a PersonsDirectoryProvider"
    );
  return ctx;
}
