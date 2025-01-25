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
      if (!userId) return null;
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      console.log("Profile data:", data);
      return data as Profile;
    },
    enabled: !!userId, // Only run query when userId is available
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("Current user:", user.id);
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

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

  if (profileError) {
    console.error("Profile error:", profileError);
    // Cast the error to PostgrestError to access the code property
    const pgError = profileError as PostgrestError;
    // Only show ProfileForm if the error is that the profile doesn't exist
    if (pgError.code === 'PGRST116') {
      return userId ? <ProfileForm userId={userId} onSuccess={() => window.location.reload()} /> : null;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was an error loading your profile. Please try again later.
            </CardDescription>
          </CardHeader>
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

        {!userId ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        ) : !profile ? (
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