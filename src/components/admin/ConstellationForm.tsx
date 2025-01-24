import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ConstellationFormProps {
  constellation?: {
    id: string;
    name: string;
    description: string | null;
  };
  onClose: () => void;
}

const ConstellationForm = ({ constellation, onClose }: ConstellationFormProps) => {
  const [name, setName] = useState(constellation?.name || "");
  const [description, setDescription] = useState(constellation?.description || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (constellation) {
        // Update existing constellation
        const { error } = await supabase
          .from("constellations")
          .update({ name, description })
          .eq("id", constellation.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Constellation updated successfully",
        });
      } else {
        // Create new constellation
        const { error } = await supabase
          .from("constellations")
          .insert([{ name, description }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Constellation created successfully",
        });
      }

      // Refresh constellations data
      queryClient.invalidateQueries({ queryKey: ["admin-constellations"] });
      onClose();
    } catch (error: any) {
      console.error("Error saving constellation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">
        {constellation ? "Edit Constellation" : "New Constellation"}
      </h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter constellation name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter constellation description"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {constellation ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

export default ConstellationForm;