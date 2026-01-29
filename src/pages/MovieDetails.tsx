import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Clock, Calendar, MapPin } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [ticketCount, setTicketCount] = useState(2);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const { data: movie, isLoading: movieLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: showtimes, isLoading: showtimesLoading } = useQuery({
    queryKey: ['showtimes', id, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          *,
          theater:theaters(*)
        `)
        .eq('movie_id', id)
        .eq('show_date', format(selectedDate, 'yyyy-MM-dd'))
        .order('start_time');
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Group showtimes by theater
  const theaterShowtimes = showtimes?.reduce((acc, showtime) => {
    const theaterId = showtime.theater_id;
    if (!acc[theaterId]) {
      acc[theaterId] = {
        theater: showtime.theater,
        showtimes: [],
      };
    }
    acc[theaterId].showtimes.push(showtime);
    return acc;
  }, {} as Record<string, { theater: any; showtimes: any[] }>);

  const handleSelectShowtime = (showtimeId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    navigate(`/select-seats/${showtimeId}?tickets=${ticketCount}`);
  };

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <Skeleton className="h-64 w-full rounded-lg mb-6" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Movie not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Movie Banner */}
      <section className="relative h-[300px] md:h-[400px] bg-gradient-to-r from-background to-muted overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${movie.poster_url})` }}
        />
        <div className="relative container h-full flex items-end px-4 pb-8">
          <div className="flex gap-6 items-end">
            <img
              src={movie.poster_url || '/placeholder.svg'}
              alt={movie.title}
              className="hidden md:block w-48 rounded-lg shadow-xl -mb-16"
            />
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                {movie.rating && (
                  <Badge className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {movie.rating}
                  </Badge>
                )}
                <Badge variant="outline">{movie.genre}</Badge>
                <Badge variant="outline">{movie.language}</Badge>
                {movie.duration_minutes && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m
                  </span>
                )}
              </div>
              <p className="text-muted-foreground max-w-2xl">{movie.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Count Selector */}
      <section className="bg-muted/50 py-4 border-b">
        <div className="container px-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Number of Seats:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <Button
                  key={num}
                  variant={ticketCount === num ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTicketCount(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Date Selection */}
      <section className="py-4 border-b">
        <div className="container px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 date-scroll">
            {dates.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center min-w-[70px] p-3 rounded-lg transition-colors ${
                  format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <span className="text-xs uppercase">{format(date, 'EEE')}</span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
                <span className="text-xs">{format(date, 'MMM')}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Theaters and Showtimes */}
      <section className="py-8">
        <div className="container px-4">
          <h2 className="text-2xl font-bold mb-6">
            Theaters Showing {movie.title}
          </h2>

          {showtimesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : Object.keys(theaterShowtimes || {}).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No shows available for {format(selectedDate, 'EEEE, MMMM d')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try selecting a different date
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.values(theaterShowtimes || {}).map(({ theater, showtimes }) => (
                <Card key={theater.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{theater.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {theater.location}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {showtimes.map((showtime) => (
                          <Button
                            key={showtime.id}
                            variant="outline"
                            className="flex flex-col items-center min-w-[80px] h-auto py-2 hover:border-primary hover:text-primary"
                            onClick={() => handleSelectShowtime(showtime.id)}
                          >
                            <span className="font-semibold">
                              {showtime.start_time.slice(0, 5)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ₹{showtime.price}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />
    </div>
  );
}
