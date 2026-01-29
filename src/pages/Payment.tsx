import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { CreditCard, Building, Smartphone, CheckCircle } from 'lucide-react';

type PaymentMethod = 'credit' | 'debit' | 'upi';

export default function Payment() {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const seatIds = searchParams.get('seats')?.split(',') || [];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [processing, setProcessing] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

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

  const { data: seats } = useQuery({
    queryKey: ['selected-seats', seatIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .in('id', seatIds);
      
      if (error) throw error;
      return data;
    },
    enabled: seatIds.length > 0,
  });

  const totalAmount = showtime ? Number(showtime.price) * seatIds.length : 0;

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!user || !showtimeId) throw new Error('Invalid booking data');

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          showtime_id: showtimeId,
          total_amount: totalAmount,
          status: 'pending',
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Add seats to booking
      const bookingSeats = seatIds.map((seatId) => ({
        booking_id: booking.id,
        seat_id: seatId,
      }));

      const { error: seatsError } = await supabase
        .from('booking_seats')
        .insert(bookingSeats);

      if (seatsError) throw seatsError;

      // Update seat status
      const { error: updateError } = await supabase
        .from('seats')
        .update({ status: 'booked' })
        .in('id', seatIds);

      if (updateError) throw updateError;

      return booking;
    },
  });

  const handlePayment = async () => {
    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const booking = await createBookingMutation.mutateAsync();

      // Update booking to paid status (mock)
      await supabase
        .from('bookings')
        .update({ status: 'paid' })
        .eq('id', booking.id);

      setBookingId(booking.id);
      setBookingComplete(true);

      // Mock email notification with toast
      toast({
        title: '📧 Booking Confirmation Sent!',
        description: `Your booking confirmation has been sent to ${user?.email}`,
      });

      queryClient.invalidateQueries({ queryKey: ['seats'] });
    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (showtimeLoading) {
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

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-16 text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Your booking ID is: <span className="font-mono font-bold">{bookingId?.slice(0, 8).toUpperCase()}</span>
          </p>
          
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Movie</span>
                <span className="font-medium">{showtime?.movie?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theater</span>
                <span className="font-medium">{showtime?.theater?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">
                  {format(new Date(showtime?.show_date || ''), 'MMM d, yyyy')} • {showtime?.start_time.slice(0, 5)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seats</span>
                <span className="font-medium">
                  {seats?.map(s => `${s.row_name}${s.seat_number}`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total Paid</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')}>
              Browse More Movies
            </Button>
            <Button variant="outline" onClick={() => navigate('/bookings')}>
              My Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="credit" id="credit" />
                    <Label htmlFor="credit" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5" />
                      <span>Credit Card</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="debit" id="debit" />
                    <Label htmlFor="debit" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Building className="h-5 w-5" />
                      <span>Debit Card</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5" />
                      <span>UPI</span>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Mock card form */}
                {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" type="password" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="name">Name on Card</Label>
                      <Input id="name" placeholder="John Doe" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="mt-6">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input id="upiId" placeholder="yourname@upi" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <img
                    src={showtime?.movie?.poster_url || '/placeholder.svg'}
                    alt={showtime?.movie?.title}
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-semibold">{showtime?.movie?.title}</h3>
                    <p className="text-sm text-muted-foreground">{showtime?.movie?.genre}</p>
                    <p className="text-sm text-muted-foreground">{showtime?.theater?.name}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{format(new Date(showtime?.show_date || ''), 'EEE, MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span>{showtime?.start_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seats</span>
                    <span>{seats?.map(s => `${s.row_name}${s.seat_number}`).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tickets</span>
                    <span>{seatIds.length} x ₹{showtime?.price}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
