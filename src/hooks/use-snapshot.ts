import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { loadSnapshot, type Snapshot } from "@/lib/focus-storage";

/** Loads all local data and reloads it every time the screen gains focus. */
export function useSnapshot() {
  const [data, setData] = useState<Snapshot | null>(null);

  const refresh = useCallback(async () => {
    const next = await loadSnapshot();
    setData(next);
    return next;
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { data, refresh };
}
