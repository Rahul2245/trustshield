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
        <div className="overflow-hidden rounded-[28px] border border-border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Last Login</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[user.status]}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map(
                        (status) =>
                          user.status !== status && (
                            <Button
                              key={status}
                              variant="outline"
                              size="sm"
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
