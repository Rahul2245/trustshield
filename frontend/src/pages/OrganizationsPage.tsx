import React, { useEffect, useState } from "react";
import { CommunityLayout } from "@/components/layout/CommunityLayout";
import { OrgCard } from "@/components/org/OrgCard";
import { getOrganizations } from "@/services/community-api";
import { useAuthStore } from "@/store/auth";
import { Loader2 } from "lucide-react";

export const OrganizationsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchOrgs = async () => {
    try {
      const res = await getOrganizations(1);
      setOrgs(res.data.items);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  return (
    <CommunityLayout>
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <h2 className="text-xl font-bold text-slate-900">Organizations</h2>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgs.map(org => (
              <OrgCard key={org._id} org={org} userId={user?.id} onUpdate={fetchOrgs} />
            ))}
          </div>
        )}
      </div>
    </CommunityLayout>
  );
};
