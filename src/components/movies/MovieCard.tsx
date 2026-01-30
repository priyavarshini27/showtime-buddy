import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, Play } from 'lucide-react';
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
    <Card className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 bg-card border-border/50">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
        
        {/* Rating badge */}
        {movie.rating && (
          <div className="absolute top-3 left-3">
            <Badge className="flex items-center gap-1 bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              {movie.rating}
            </Badge>
          </div>
        )}

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl backdrop-blur-sm">
            <Play className="h-7 w-7 text-primary-foreground fill-current ml-1" />
          </div>
        </div>

        {/* Book button overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button 
            className="w-full shadow-xl" 
            size="sm"
            onClick={handleBookNow}
          >
            Book Tickets
          </Button>
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-bold text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            {movie.genre}
          </Badge>
          {movie.duration_minutes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m
            </span>
          )}
        </div>
        {movie.language && (
          <p className="text-xs text-muted-foreground/80">{movie.language}</p>
        )}
      </CardContent>
    </Card>
  );
}
