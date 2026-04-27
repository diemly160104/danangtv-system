import { useCallback, useEffect, useRef, useState } from "react";
import { danangTvDataSource } from "../data";
import type { DanangTvDb } from "../data/dataSource";
import type { EmployeeView, SessionUser } from "../types";

const SESSION_STORAGE_KEY = "danangtv-session-user";

function loadPersistedSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function persistSessionUser(user: SessionUser | null) {
  try {
    if (!user) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function useDanangTvData() {
  const [db, setDb] = useState<DanangTvDb | null>(null);
  const [loading, setLoading] = useState(true);

  const dbRef = useRef<DanangTvDb | null>(null);

  const loadDb = useCallback(async () => {
    try {
      setLoading(true);

      const data = await danangTvDataSource.loadDb();
      const persistedSession =
        dbRef.current?.sessionUser ?? loadPersistedSessionUser();

      const nextDb: DanangTvDb = {
        ...data,
        sessionUser: persistedSession,
      };

      dbRef.current = nextDb;
      setDb(nextDb);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDb();
  }, [loadDb]);

  const replaceDb = useCallback(async (nextDb: DanangTvDb) => {
    dbRef.current = nextDb;
    setDb(nextDb);
    persistSessionUser(nextDb.sessionUser);
    await danangTvDataSource.saveDb(nextDb);
  }, []);

  const commit = useCallback(
    async (updater: (prev: DanangTvDb) => DanangTvDb) => {
      const prev = dbRef.current;
      if (!prev) return;

      const next = updater(prev);
      dbRef.current = next;
      setDb(next);
      persistSessionUser(next.sessionUser);
      await danangTvDataSource.saveDb(next);
    },
    []
  );

  const saveEmployee = useCallback(
    async (payload: EmployeeView) => {
      await commit((prev) => {
        const exists = prev.employees.some(
          (item) => item.employee_id === payload.employee_id
        );

        return {
          ...prev,
          employees: exists
            ? prev.employees.map((item) =>
                item.employee_id === payload.employee_id ? payload : item
              )
            : [payload, ...prev.employees],
        };
      });
    },
    [commit]
  );

  const setSessionUser = useCallback(async (user: SessionUser | null) => {
    persistSessionUser(user);

    const prev = dbRef.current;
    if (!prev) return;

    const next = {
      ...prev,
      sessionUser: user,
    };

    dbRef.current = next;
    setDb(next);
  }, []);

  return {
    db,
    loading,
    actions: {
      loadDb,
      reload: loadDb,
      replaceDb,
      commit,
      saveEmployee,
      setSessionUser,
    },
  };
}