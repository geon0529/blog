import { useEffect, useState } from "react";

export default function useIsMounted() {
  const [isMounted, setIsMounted] = useState<boolean>();
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return {
    isMounted,
  };
}
