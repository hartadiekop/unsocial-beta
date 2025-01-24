import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Users, Loader2 } from "lucide-react";
import ConstellationForm from "./ConstellationForm";
import MembersManagement from "./MembersManagement";

const ConstellationList = () => {
  const [editingConstellation, setEditingConstellation] = useState<any>(null);
  const [showMembersFor, setShowMembersFor] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: constellations, isLoading } = useQuery({
    queryKey: ["admin-constellations"],
    queryFn: async () => {
      console.log("Fetching all constellations for admin");
      const { data, error } = await supabase
        .from("constellations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching constellations:", error);
        throw error;
      }
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Constellation Management</CardTitle>
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Constellation
          </Button>
        </div>
        <CardDescription>
          Manage all constellations and their members
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showNewForm && (
          <div className="mb-6">
            <ConstellationForm
              onClose={() => setShowNewForm(false)}
            />
          </div>
        )}
        
        {editingConstellation && (
          <div className="mb-6">
            <ConstellationForm
              constellation={editingConstellation}
              onClose={() => setEditingConstellation(null)}
            />
          </div>
        )}

        {showMembersFor && (
          <div className="mb-6">
            <MembersManagement
              constellationId={showMembersFor}
              onClose={() => setShowMembersFor(null)}
            />
          </div>
        )}

        <div className="space-y-4">
          {constellations?.map((constellation) => (
            <div
              key={constellation.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{constellation.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {constellation.description || "No description"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMembersFor(constellation.id)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingConstellation(constellation)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConstellationList;