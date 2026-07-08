import { useEffect } from "react";
import { toast } from "sonner";

import { onThreatAlert } from "@/services/socket";
import type { ThreatAlert } from "@/types";

export function AlertListener() {
  useEffect(() => {
    const unsubscribe = onThreatAlert((alert: ThreatAlert) => {
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
  }, []);

  return null;
}
