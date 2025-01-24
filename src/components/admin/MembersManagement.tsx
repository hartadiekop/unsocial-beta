import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, UserPlus, UserMinus } from "lucide-react";

interface MembersManagementProps {
  constellationId: string;
  onClose: () => void;
}

const MembersManagement = ({ constellationId, onClose }: MembersManagementProps) => {
  const [newMemberWhatsapp, setNewMemberWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch constellation details
  const { data: constellation } = useQuery({
    queryKey: ["constellation", constellationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("constellations")
        .select("*")
        .eq("id", constellationId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch current members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["constellation-members", constellationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("constellation_members")
        .select(`
          id,
          profile:profiles (
            id,
            full_name,
            whatsapp
          )
        `)
        .eq("constellation_id", constellationId);

      if (error) throw error;
      return data;
    },
  });

  const addMember = async () => {
    setLoading(true);
    try {
      // First find the profile by WhatsApp
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("whatsapp", newMemberWhatsapp)
        .single();

      if (profileError) throw new Error("Profile not found");

      // Add member to constellation
      const { error } = await supabase
        .from("constellation_members")
        .insert([
          {
            profile_id: profile.id,
            constellation_id: constellationId,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member added successfully",
      });

      setNewMemberWhatsapp("");
      queryClient.invalidateQueries({ 
        queryKey: ["constellation-members", constellationId] 
      });
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("constellation_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed successfully",
      });

      queryClient.invalidateQueries({ 
        queryKey: ["constellation-members", constellationId] 
      });
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (membersLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Members of {constellation?.name}
        </h3>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          value={newMemberWhatsapp}
          onChange={(e) => setNewMemberWhatsapp(e.target.value)}
          placeholder="Enter member's WhatsApp number"
        />
        <Button onClick={addMember} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {members?.map((member: any) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <div>
              <p className="font-medium">{member.profile.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {member.profile.whatsapp}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeMember(member.id)}
            >
              <UserMinus className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersManagement;