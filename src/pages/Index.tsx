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
import { Loader2, LogOut, Users, UserCheck, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProfileForm from "@/components/ProfileForm";

interface Profile {
  id: string;
  full_name: string;
  whatsapp: string;
  bio: string | null;
  dating_preferences: any;
  is_approved: boolean;
}

interface Constellation {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        console.log("Current user:", user);
      }
    };
    getUser();
  }, []);

  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      return data as Profile;
    },
    enabled: !!userId,
  });

  const { data: constellations, isLoading: constellationsLoading } = useQuery({
    queryKey: ["constellations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("constellations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching constellations:", error);
        throw error;
      }
      return data as Constellation[];
    },
  });

  const handleJoinConstellation = async (constellationId: string) => {
    if (!userId || !profile) return;

    try {
      const { error } = await supabase
        .from("constellation_members")
        .insert([
          {
            profile_id: userId,
            constellation_id: constellationId,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've joined the constellation.",
      });
    } catch (error: any) {
      console.error("Error joining constellation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Unsocial
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
        ) : profile ? (
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
        ) : (
          <ProfileForm userId={userId} onSuccess={refetchProfile} />
        )}

        {profile && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {constellations?.map((constellation) => (
              <Card key={constellation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {constellation.name}
                  </CardTitle>
                  <CardDescription>
                    Created on{" "}
                    {new Date(constellation.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {constellation.description || "No description available"}
                  </p>
                  <Button 
                    onClick={() => handleJoinConstellation(constellation.id)}
                    className="w-full"
                  >
                    Join Constellation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {constellations?.length === 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>No Constellations Yet</CardTitle>
              <CardDescription>
                Join or create a constellation to start connecting with others
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;