import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, MoreHorizontal, GraduationCap, BookOpen, ShieldCheck, UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Role = "student" | "faculty" | "admin";
type Status = "active" | "inactive";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  branch: string;
  status: Status;
  joinedAt: string;
}


const roleConfig: Record<Role, { icon: React.ElementType; className: string; label: string }> = {
  student: { icon: GraduationCap, className: "bg-info/10 text-info border-info/20", label: "Student" },
  faculty: { icon: BookOpen, className: "bg-primary/10 text-primary border-primary/20", label: "Faculty" },
  admin: { icon: ShieldCheck, className: "bg-warning/10 text-warning border-warning/20", label: "Admin" },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Role>("all");
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase.from("users_view").select("*").order("joined_at", { ascending: false });
      if (data) {
        setAllUsers(data.map(u => ({
          id: u.id,
          name: u.name || "Unknown",
          email: u.email,
          role: (u.role as Role) || "student",
          branch: u.branch || "N/A",
          status: (u.status as Status) || "active",
          joinedAt: u.joined_at ? new Date(u.joined_at).toISOString().split('T')[0] : "N/A"
        })));
      } else if (error) {
        console.error("Failed to load users", error);
        toast.error("Failed to load users from database");
      }
      setLoading(false);
    }
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    return allUsers.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allUsers, filter, search]);

  const counts = useMemo(() => ({
    all: allUsers.length,
    student: allUsers.filter((u) => u.role === "student").length,
    faculty: allUsers.filter((u) => u.role === "faculty").length,
    admin: allUsers.filter((u) => u.role === "admin").length,
  }), [allUsers]);

  const handleAction = (action: string, name: string) => {
    toast.success(`${action} – ${name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Users</h2>
          <p className="text-sm text-muted-foreground mt-0.5">View, edit roles, and manage account status.</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" /> Invite User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["all", "student", "faculty", "admin"] as const).map((k) => (
          <Card key={k}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts[k]}</p>
                <p className="text-xs text-muted-foreground capitalize">{k === "all" ? "Total Users" : `${k}s`}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-lg">All Users</CardTitle>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="student">Students</TabsTrigger>
                  <TabsTrigger value="faculty">Faculty</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch / Dept</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                     <TableCell colSpan={6} className="text-center py-8">
                       <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                       <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
                     </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => {
                    const rc = roleConfig[u.role];
                    const initials = u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-muted text-foreground text-xs font-medium">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${rc.className}`}>
                            <rc.icon className="h-3 w-3" /> {rc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.branch}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            u.status === "active"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground border-border"
                          }>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${u.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.joinedAt}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAction("Viewed profile", u.name)}>View profile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction("Changed role", u.name)}>Change role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleAction(u.status === "active" ? "Deactivated" : "Activated", u.name)}
                              >
                                {u.status === "active" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
