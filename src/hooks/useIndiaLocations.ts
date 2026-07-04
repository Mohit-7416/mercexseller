import { useEffect, useState, useCallback } from "react";

// Uses free public APIs:
//   - https://countriesnow.space/api/v0.1/countries/states   (POST { country })
//   - https://countriesnow.space/api/v0.1/countries/state/cities (POST { country, state })
//   - https://api.postalpincode.in/postoffice/{area}       (GET) — returns list with Pincode

const STATES_URL = "https://countriesnow.space/api/v0.1/countries/states";
const CITIES_URL = "https://countriesnow.space/api/v0.1/countries/state/cities";
const PIN_URL = (city: string) => `https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`;

export const useIndiaStates = () => {
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(STATES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India" }),
    })
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        const arr: string[] = (j?.data?.states || []).map((s: any) => s.name).filter(Boolean);
        setStates(arr.sort());
      })
      .catch(() => alive && setStates([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return { states, loading };
};

export const useIndiaCities = (state: string) => {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) { setCities([]); return; }
    let alive = true;
    setLoading(true);
    fetch(CITIES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India", state }),
    })
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        const arr: string[] = (j?.data || []).filter(Boolean);
        setCities(arr.sort());
      })
      .catch(() => alive && setCities([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [state]);

  return { cities, loading };
};

export const useIndiaPincodes = (city: string) => {
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNow = useCallback(() => {
    if (!city) { setPincodes([]); return; }
    let alive = true;
    setLoading(true);
    fetch(PIN_URL(city))
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        const rows = Array.isArray(j) ? j[0]?.PostOffice || [] : [];
        const uniq: string[] = Array.from(new Set(rows.map((p: any) => String(p.Pincode)).filter(Boolean)));
        setPincodes(uniq.sort());
      })
      .catch(() => alive && setPincodes([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [city]);

  useEffect(() => { fetchNow(); }, [fetchNow]);

  return { pincodes, loading, refresh: fetchNow };
};
