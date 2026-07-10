import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsers, updateUserStatus } from "@/services/api";
import type { AccountStatus, User } from "@/types";

const statusColors: Record<AccountStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const loadUsers = () => {
    setLoading(true);
    getUsers({ page: 1, limit: 50, status: statusFilter || undefined })
      .then((data) => setUsers(data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const handleStatusChange = async (userId: string, status: AccountStatus) => {
    try {
      await updateUserStatus(userId, status);
      toast.success(`User status updated to ${status}`);
      loadUsers();
    } catch {
      toast.error("Failed to update user status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">User Management</h1>
        <p className="mt-1 text-muted">
          Account statuses from MongoDB core state store
        </p>
      </div>

      <div className="flex gap-2">
        {["", "ACTIVE", "INACTIVE", "SUSPENDED"].map((status) => (
          <Button
            key={status || "all"}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status || "All"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[28px] border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-primary">Email</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">Role</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">Last Login</th>
                <th className="px-6 py-4 text-left font-semibold text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-primary/10 even:bg-primary/5 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-primary">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{user.role}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={statusColors[user.status]}>{user.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 items-center">
                      {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map(
                        (status) =>
                          user.status !== status && (
                            <Button
                              key={status}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleStatusChange(user.id, status)}
                            >
                              {status}
                            </Button>
                          )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
