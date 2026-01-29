import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export default function SeatSelection() {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const ticketCount = parseInt(searchParams.get('tickets') || '2');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const { data: showtime, isLoading: showtimeLoading } = useQuery({
    queryKey: ['showtime-details', showtimeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          *,
          movie:movies(*),
          theater:theaters(*)
        `)
        .eq('id', showtimeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!showtimeId,
  });

  const { data: seats, isLoading: seatsLoading } = useQuery({
    queryKey: ['seats', showtimeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('showtime_id', showtimeId)
        .order('row_name')
        .order('seat_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!showtimeId,
  });

  // Group seats by row
  const seatsByRow = seats?.reduce((acc, seat) => {
    if (!acc[seat.row_name]) {
      acc[seat.row_name] = [];
    }
    acc[seat.row_name].push(seat);
    return acc;
  }, {} as Record<string, typeof seats>);

  const handleSeatClick = (seatId: string, status: string) => {
    if (status === 'booked') return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= ticketCount) {
        toast({
          title: 'Seat limit reached',
          description: `You can only select ${ticketCount} seats.`,
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, seatId];
    });
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length !== ticketCount) {
      toast({
        title: 'Select seats',
        description: `Please select exactly ${ticketCount} seats.`,
        variant: 'destructive',
      });
      return;
    }
    navigate(`/payment/${showtimeId}?seats=${selectedSeats.join(',')}`);
  };

  const totalAmount = showtime ? Number(showtime.price) * selectedSeats.length : 0;

  if (showtimeLoading || seatsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!showtime) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Showtime not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        {/* Movie Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{showtime.movie?.title}</h1>
          <p className="text-muted-foreground">
            {showtime.theater?.name} • {format(new Date(showtime.show_date), 'EEE, MMM d')} • {showtime.start_time.slice(0, 5)}
          </p>
        </div>

        {/* Screen */}
        <div className="mb-8 text-center">
          <div className="w-full max-w-2xl mx-auto h-8 bg-muted rounded-t-full flex items-center justify-center text-sm text-muted-foreground">
            SCREEN
          </div>
        </div>

        {/* Seat Grid */}
        <div className="max-w-3xl mx-auto mb-8">
          {Object.entries(seatsByRow || {}).map(([rowName, rowSeats]) => (
            <div key={rowName} className="flex items-center gap-2 mb-2">
              <span className="w-6 text-sm font-medium text-muted-foreground">{rowName}</span>
              <div className="flex gap-1 flex-wrap justify-center flex-1">
                {rowSeats?.sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number)).map((seat) => {
                  const isSelected = selectedSeats.includes(seat.id);
                  const isBooked = seat.status === 'booked';
                  
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat.id, seat.status)}
                      disabled={isBooked}
                      className={`seat ${
                        isBooked 
                          ? 'seat-booked' 
                          : isSelected 
                            ? 'seat-selected' 
                            : 'seat-available'
                      }`}
                      title={`${rowName}${seat.seat_number}`}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
              </div>
              <span className="w-6 text-sm font-medium text-muted-foreground">{rowName}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-lg border-2 border-green-500" />
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-lg bg-primary" />
            <span className="text-sm">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-lg bg-muted-foreground/50" />
            <span className="text-sm">Booked</span>
          </div>
        </div>

        {/* Summary */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Selected Seats</span>
              <span className="font-medium">
                {selectedSeats.length > 0 
                  ? seats?.filter(s => selectedSeats.includes(s.id)).map(s => `${s.row_name}${s.seat_number}`).join(', ')
                  : 'None'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tickets</span>
              <span>{selectedSeats.length} / {ticketCount}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleProceedToPayment}
              disabled={selectedSeats.length !== ticketCount}
            >
              Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
