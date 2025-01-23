import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Unsocial</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Keluar
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl">Selamat datang di Unsocial!</h2>
          <p className="text-muted-foreground mt-2">
            Halaman ini akan segera diperbarui dengan fitur-fitur utama.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;