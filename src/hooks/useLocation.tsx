import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface LocationContextType {
  city: string;
  setCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'bookmyshow_city';

export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'Mumbai';
    }
    return 'Mumbai';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, city);
  }, [city]);

  return (
    <LocationContext.Provider value={{ city, setCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
