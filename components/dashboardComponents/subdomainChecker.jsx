import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

function useDebounce(value, delay = 600) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export default function SubdomainChecker({ control, onAvailableChange }) {
  const subdomain = useWatch({ control, name: "subdomain" });
  const debouncedSubdomain = useDebounce(subdomain, 600);

  useEffect(() => {
    if (!onAvailableChange) return;

    if (!debouncedSubdomain || debouncedSubdomain.length < 3) {
      onAvailableChange(null);
      return;
    }

    let active = true;

    (async () => {
      try {
        onAvailableChange("checking");
        const res = await fetch(
          `/api/stores/check?subdomain=${encodeURIComponent(debouncedSubdomain)}`
        );
        const json = await res.json();
        if (active) {
          onAvailableChange(json.available === true);
        }
      } catch (err) {
        console.error(err);
        if (active) onAvailableChange(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedSubdomain, onAvailableChange]);

  return null;
}
