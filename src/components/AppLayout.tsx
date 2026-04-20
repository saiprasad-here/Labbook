import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function AppLayout() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const displayName = user?.name?.split(" ").slice(0, 2).join(" ") ?? "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 sticky top-0 z-10 gap-4">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground">
              Digital Lab Record Management
            </h1>
            {user && (
              <div className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-muted-foreground hidden sm:inline">Hey,</span>
                <span className="font-semibold text-foreground">{displayName}</span>
                {user.branch && (
                  <span className="hidden md:inline text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                    {user.branch}
                  </span>
                )}
              </div>
            )}
          </header>
          <main className="flex-1 p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
