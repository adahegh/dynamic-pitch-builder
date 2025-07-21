
import PitchBuilder from "@/components/PitchBuilder";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm border-b">
        <h1 className="text-lg font-semibold">Welcome, {user?.email}</h1>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
      <PitchBuilder />
    </div>
  );
};

export default Index;
