import { useState } from 'react';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CITIES = [
  { name: 'Mumbai', popular: true },
  { name: 'Delhi', popular: true },
  { name: 'Bangalore', popular: true },
  { name: 'Chennai', popular: true },
  { name: 'Hyderabad', popular: true },
  { name: 'Kolkata', popular: true },
  { name: 'Pune', popular: false },
  { name: 'Ahmedabad', popular: false },
  { name: 'Jaipur', popular: false },
  { name: 'Lucknow', popular: false },
  { name: 'Chandigarh', popular: false },
  { name: 'Kochi', popular: false },
];

interface LocationSelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export function LocationSelector({ selectedCity, onCityChange }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCities = CITIES.filter((city) =>
    city.name.toLowerCase().includes(search.toLowerCase())
  );

  const popularCities = filteredCities.filter((c) => c.popular);
  const otherCities = filteredCities.filter((c) => !c.popular);

  const handleSelectCity = (city: string) => {
    onCityChange(city);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors group">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">{selectedCity}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Select Your City
          </DialogTitle>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for your city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
          {popularCities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Popular Cities
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {popularCities.map((city) => (
                  <Button
                    key={city.name}
                    variant={selectedCity === city.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectCity(city.name)}
                    className="justify-start"
                  >
                    {city.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {otherCities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Other Cities
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {otherCities.map((city) => (
                  <Button
                    key={city.name}
                    variant={selectedCity === city.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectCity(city.name)}
                    className="justify-start"
                  >
                    {city.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {filteredCities.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No cities found matching "{search}"
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
