import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, X } from "lucide-react";

const UserConstellations = () => {
  const [selectedConstellation, setSelectedConstellation] = useState<string | null>(
    null
  );

  // Fetch user's constellations
  const { data: constellations, isLoading: constellationsLoading } = useQuery({
    queryKey: ["user-constellations"],
    queryFn: async () => {
      console.log("Fetching user constellations");
      const { data, error } = await supabase
        .from("constellation_members")
        .select(`
          constellation:constellations (
            id,
            name,
            description
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((item) => item.constellation);
    },
  });

  // Fetch constellation members when a constellation is selected
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["constellation-members", selectedConstellation],
    queryFn: async () => {
      if (!selectedConstellation) return null;
      console.log("Fetching constellation members:", selectedConstellation);
      const { data, error } = await supabase
        .from("constellation_members")
        .select(`
          id,
          profile:profiles (
            id,
            full_name,
            whatsapp,
            bio
          )
        `)
        .eq("constellation_id", selectedConstellation);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedConstellation,
  });

  if (constellationsLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Constellations</CardTitle>
        <CardDescription>
          View your constellations and their members
        </CardDescription>
      </CardHeader>
      <CardContent>
        {constellations?.length === 0 ? (
          <p className="text-muted-foreground">
            You are not part of any constellations yet.
          </p>
        ) : (
          <div className="space-y-4">
            {constellations?.map((constellation: any) => (
              <div
                key={constellation.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{constellation.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {constellation.description || "No description"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSelectedConstellation(
                        selectedConstellation === constellation.id
                          ? null
                          : constellation.id
                      )
                    }
                  >
                    {selectedConstellation === constellation.id ? (
                      <X className="h-4 w-4 mr-2" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    {selectedConstellation === constellation.id
                      ? "Close"
                      : "View Members"}
                  </Button>
                </div>

                {selectedConstellation === constellation.id && (
                  <div className="space-y-2 pl-4 border-l-2">
                    {membersLoading ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      members?.map((member: any) => (
                        <div
                          key={member.id}
                          className="p-2 border rounded bg-muted/50"
                        >
                          <p className="font-medium">{member.profile.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.profile.whatsapp}
                          </p>
                          {member.profile.bio && (
                            <p className="text-sm mt-1">{member.profile.bio}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserConstellations;