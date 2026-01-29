import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface MovieCardProps {
  movie: Tables<'movies'>;
}

export function MovieCard({ movie }: MovieCardProps) {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <Card className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {movie.rating && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="flex items-center gap-1 bg-foreground/70 text-background">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {movie.rating}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4">
            <Button 
              className="w-full" 
              size="sm"
              onClick={handleBookNow}
            >
              Book Tickets
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm md:text-base line-clamp-1">{movie.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {movie.genre}
          </Badge>
          {movie.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m
            </span>
          )}
        </div>
        {movie.language && (
          <p className="text-xs text-muted-foreground mt-1">{movie.language}</p>
        )}
      </CardContent>
    </Card>
  );
}
