import { useEffect } from "react";
import { toast } from "sonner";

import type { ThreatAlert } from "@/types";
import { useAuthStore } from "@/store/auth";
import { onThreatAlert } from "@/services/socket";

export function AlertListener() {
  const { user } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onThreatAlert((alert: ThreatAlert) => {
      // Differentiate between Admin and User views
      const isAdmin = user?.role === "ADMIN" || user?.role === "ANALYST";

      if (!isAdmin) {
        // Regular user should only see alerts for their own events
        if (alert.userId === user?.id) {
          toast.error("Threat Zone Warning", {
            description: "Your recent activity has been classified as a threat by our safety systems. Moderation action is pending.",
            duration: 8000,
            style: {
              background: '#fee2e2', // red-50
              color: '#991b1b',      // red-800
              border: '1px solid #f87171' // red-400
            }
          });
        }
        return;
      }

      // Admin View
      const isCritical =
        alert.severity === "CRITICAL" || alert.severity === "HIGH";

      toast.error(alert.message, {
        description: [
          alert.action && `Action: ${alert.action}`,
          alert.riskScore !== undefined && `Risk: ${alert.riskScore.toFixed(1)}`,
          alert.correlationId && `ID: ${alert.correlationId.slice(0, 8)}...`,
        ]
          .filter(Boolean)
          .join(" · "),
        duration: isCritical ? 10000 : 5000,
        action: alert.eventId
          ? {
              label: "View",
              onClick: () => {
                window.location.href = `/threats/${alert.eventId}`;
              },
            }
          : undefined,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  return null;
}
