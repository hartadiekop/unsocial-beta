import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, LogOut, UserCheck, UserPlus, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProfileForm from "@/components/ProfileForm";
import ConstellationList from "@/components/admin/ConstellationList";
import UserConstellations from "@/components/user/UserConstellations";
import { PostgrestError } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string;
  whatsapp: string;
  bio: string | null;
  dating_preferences: any;
  is_approved: boolean;
  role: 'user' | 'admin';
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Use React Query to fetch and cache the profile data
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) {
        console.log("No userId available yet");
        return null;
      }
      
      console.log("Attempting to fetch profile for user:", userId);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Supabase error fetching profile:", error);
          throw error;
        }

        console.log("Successfully fetched profile:", data);
        return data as Profile;
      } catch (error) {
        console.error("Error in profile fetch:", error);
        throw error;
      }
    },
    enabled: !!userId,
    retry: 1, // Only retry once to avoid too many retries on actual errors
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error);
        return;
      }
      if (user) {
        console.log("Current user found:", user.id);
        setUserId(user.id);
      } else {
        console.log("No user found, redirecting to auth");
        navigate("/auth");
      }
    };
    getUser();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Handle the case where we have no userId yet
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Special handling for the case where profile doesn't exist
  if (profileError) {
    console.error("Profile error details:", profileError);
    const pgError = profileError as PostgrestError;
    
    // PGRST116 is the error code when no rows are returned
    if (pgError.code === 'PGRST116') {
      console.log("No profile found, showing profile form");
      return <ProfileForm userId={userId} onSuccess={() => window.location.reload()} />;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
            <CardDescription>
              There was an error loading your profile. Error code: {pgError.code}
              <br />
              Message: {pgError.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Unsocial {profile?.role === 'admin' && <Shield className="inline-block ml-2 h-6 w-6" />}
          </h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {!profile ? (
          <ProfileForm userId={userId} onSuccess={() => window.location.reload()} />
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {profile.is_approved ? (
                    <UserCheck className="h-6 w-6 text-green-500" />
                  ) : (
                    <UserPlus className="h-6 w-6 text-yellow-500" />
                  )}
                  <div>
                    <CardTitle>Welcome, {profile.full_name}!</CardTitle>
                    <CardDescription>
                      {profile.is_approved
                        ? "Your profile is approved and visible to others"
                        : "Your profile is pending approval"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{profile.bio || "No bio yet"}</p>
                  <p className="text-sm">WhatsApp: {profile.whatsapp}</p>
                </div>
              </CardContent>
            </Card>

            {profile.role === 'admin' ? (
              <ConstellationList />
            ) : (
              profile.is_approved && <UserConstellations />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;