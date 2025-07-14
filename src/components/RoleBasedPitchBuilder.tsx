import { useState } from "react";
import { PitchBuilder } from "@/components/PitchBuilder";
import { UserHeader } from "@/components/UserHeader";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";

export function RoleBasedPitchBuilder() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('pitch-builder');

  if (!isAdmin) {
    // Standard users see only pitch builder
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <UserHeader />
        <div className="p-6">
          <div className="mb-4 py-2">
            <div className="w-full bg-primary/10 rounded-md p-2 text-center">
              <span className="text-primary font-medium">Pitch Builder</span>
            </div>
          </div>
          <PitchBuilder />
        </div>
      </div>
    );
  }

  // Admin users see tabs with both pitch builder and system prompts
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <UserHeader />
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pitch-builder">Pitch Builder</TabsTrigger>
            <TabsTrigger value="system-prompts" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System Prompts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pitch-builder">
            <PitchBuilder />
          </TabsContent>

          <TabsContent value="system-prompts">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">System Prompts Management</h2>
              <p className="text-gray-600">
                This section would contain system prompt management functionality.
                For now, only admins can see this tab.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}