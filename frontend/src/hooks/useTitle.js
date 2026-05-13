import { useEffect } from "react";

/**
 * Sets document.title with optional suffix.
 * Usage: useTitle("My Shipments")
 */
const useTitle = (title, suffix = "DHL Global Forwarding") => {
  useEffect(() => {
    if (!title) return undefined;
    const prev = document.title;
    document.title = suffix ? `${title} | ${suffix}` : title;
    return () => {
      document.title = prev;
    };
  }, [title, suffix]);
};

export default useTitle;
