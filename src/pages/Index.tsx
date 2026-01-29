import { Header } from '@/components/layout/Header';
import { FeaturedMovies } from '@/components/movies/FeaturedMovies';
import { MovieListings } from '@/components/movies/MovieListings';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner */}
      <section className="relative h-[300px] md:h-[400px] bg-gradient-to-r from-primary/20 to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920')] bg-cover bg-center opacity-30" />
        <div className="relative container h-full flex items-center px-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Book Your <span className="text-primary">Movie Tickets</span> Online
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mb-6">
              Browse the latest movies, find showtimes, and book tickets instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Movies */}
      <FeaturedMovies />

      {/* All Movies */}
      <MovieListings />

      {/* Footer */}
      <footer className="bg-muted py-8 mt-8">
        <div className="container px-4 text-center text-muted-foreground">
          <p>&copy; 2024 BookMyShow Clone. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
