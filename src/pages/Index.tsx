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
import { Loader2, LogOut, UserCheck, UserPlus, Shield, UserX } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProfileForm from "@/components/ProfileForm";
import ConstellationList from "@/components/admin/ConstellationList";
import UserConstellations from "@/components/user/UserConstellations";

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
  const queryClient = useQueryClient();

  // Basic profile query with minimal complexity
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        return null;
      }

      return data as Profile;
    },
    enabled: !!userId,
  });

  // Simplified pending users query
  const { data: pendingUsers, isLoading: pendingUsersLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      if (!profile?.role || profile.role !== 'admin') return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, whatsapp, bio')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) return null;
      return data;
    },
    enabled: !!profile && profile.role === 'admin',
  });

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been approved",
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been rejected",
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };
    getUser();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
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

  if (!profile && userId) {
    return <ProfileForm userId={userId} onSuccess={() => window.location.reload()} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              Unable to load profile. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Retry
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

            {profile.role === 'admin' && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>
                    Manage user approval requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingUsersLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : pendingUsers && pendingUsers.length > 0 ? (
                    <div className="space-y-4">
                      {pendingUsers.map((user: Profile) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.whatsapp}</p>
                            {user.bio && (
                              <p className="text-sm mt-1">{user.bio}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveUser(user.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No pending approval requests
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

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
