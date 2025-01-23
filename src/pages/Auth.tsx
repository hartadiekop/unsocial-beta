import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Key, User, Phone } from "lucide-react";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email dan password harus diisi",
      });
      return false;
    }

    if (isSignUp && (!fullName || !whatsapp)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Semua field harus diisi untuk pendaftaran",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password minimal 6 karakter",
      });
      return false;
    }

    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    console.log("Starting authentication process...");

    try {
      if (isSignUp) {
        console.log("Attempting signup...");
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;

        console.log("Signup successful, creating profile...");
        if (authData.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: authData.user.id,
                full_name: fullName,
                whatsapp: whatsapp,
              },
            ]);

          if (profileError) throw profileError;
          console.log("Profile created successfully");
        }

        toast({
          title: "Berhasil mendaftar!",
          description: "Silakan cek email Anda untuk verifikasi.",
        });
      } else {
        console.log("Attempting login...");
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        console.log("Login successful");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#E5DEFF] to-[#F1F0FB] p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
            Unsocial
          </CardTitle>
          <CardDescription className="text-[#555555]">
            {isSignUp ? "Buat akun baru" : "Masuk ke akun Anda"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[#1A1F2C]">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-[#7E69AB]" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Nama lengkap Anda"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-[#1A1F2C]">Nomor WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-[#7E69AB]" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      required
                      placeholder="Contoh: +628123456789"
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1A1F2C]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-[#7E69AB]" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#1A1F2C]">Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-[#7E69AB]" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] hover:from-[#8B77E5] hover:to-[#6E599B] text-white font-medium py-2 px-4 rounded-md transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : isSignUp ? "Daftar" : "Masuk"}
            </Button>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[#555555] hover:text-[#7E69AB] transition-colors"
            >
              {isSignUp
                ? "Sudah punya akun? Masuk"
                : "Belum punya akun? Daftar"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;