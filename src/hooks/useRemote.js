import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

// 주소가 바뀌거나 다시 불러올 때 요청합니다. 이전 요청은 정리해서 늦은 응답을 무시합니다.
export function useRemote(path) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({
    path: null,
    data: null,
    error: "",
    loading: false,
  });
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setResult({ path, data: null, error: "", loading: true });
    api(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ path, data, error: "", loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ path, data: null, error: error.message, loading: false });
      });
    return () => controller.abort();
  }, [path, revision]);
  if (!path) return { data: null, error: "", loading: false, reload };
  return {
    ...(result.path === path
      ? result
      : { data: null, error: "", loading: true }),
    reload,
  };
}
