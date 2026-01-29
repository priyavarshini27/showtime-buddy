import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Ticket, MapPin, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function MyBookings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          showtime:showtimes(
            *,
            movie:movies(*),
            theater:theaters(*)
          ),
          booking_seats(
            seat:seats(*)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        {bookings?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Bookings Yet</h2>
              <p className="text-muted-foreground">
                Start browsing movies and book your first ticket!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings?.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-32 h-32 md:h-auto">
                      <img
                        src={booking.showtime?.movie?.poster_url || '/placeholder.svg'}
                        alt={booking.showtime?.movie?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.showtime?.movie?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {booking.showtime?.movie?.genre}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(booking.status)} text-white`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.showtime?.theater?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(booking.showtime?.show_date || ''), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.showtime?.start_time.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {booking.booking_seats?.map(bs => 
                              `${bs.seat?.row_name}${bs.seat?.seat_number}`
                            ).join(', ')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Booking ID: {booking.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="font-bold">₹{Number(booking.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
