import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Menu, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const openSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">book</span>
              <span className="text-2xl font-bold">my</span>
              <span className="text-2xl font-bold text-primary">show</span>
            </div>
          </Link>

          {/* Search - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for Movies, Events, Plays, Sports and Activities"
                className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Location */}
            <button className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <MapPin className="h-4 w-4" />
              <span>Mumbai</span>
            </button>

            {/* Auth buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/bookings')}>
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden sm:flex"
                  onClick={openSignIn}
                >
                  Sign In
                </Button>
                <Button 
                  size="sm" 
                  className="hidden sm:flex"
                  onClick={openSignUp}
                >
                  Sign Up
                </Button>
              </>
            )}

            {/* Mobile menu */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
}
