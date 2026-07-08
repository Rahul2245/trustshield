import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGatewayHealth, getAiWorkerHealth } from "@/services/api";

interface ServiceStatus {
  name: string;
  status: "healthy" | "unhealthy" | "loading";
  details?: Record<string, unknown>;
}

export function SystemHealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Node.js Edge Gateway", status: "loading" },
    { name: "FastAPI AI Worker", status: "loading" },
  ]);

  useEffect(() => {
    const checkHealth = async () => {
      const updated: ServiceStatus[] = [];

      try {
        const gateway = await getGatewayHealth();
        updated.push({
          name: "Node.js Edge Gateway",
          status: gateway.success ? "healthy" : "unhealthy",
          details: gateway,
        });
      } catch {
        updated.push({ name: "Node.js Edge Gateway", status: "unhealthy" });
      }

      try {
        const aiWorker = await getAiWorkerHealth();
        const ready = aiWorker?.ready?.status === "ready";
        updated.push({
          name: "FastAPI AI Worker",
          status: ready ? "healthy" : "unhealthy",
          details: aiWorker,
        });
      } catch {
        updated.push({ name: "FastAPI AI Worker", status: "unhealthy" });
      }

      setServices(updated);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatusIcon = ({ status }: { status: ServiceStatus["status"] }) => {
    if (status === "loading") return <Loader2 className="h-5 w-5 animate-spin text-muted" />;
    if (status === "healthy") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">System Health</h1>
        <p className="mt-1 text-muted">
          Infrastructure status for Redis, RabbitMQ, MongoDB, and Ollama
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => {
          const readyDetails =
            service.details?.ready &&
            typeof service.details.ready === "object" &&
            service.details.ready !== null
              ? (service.details.ready as Record<string, boolean>)
              : null;

          return (
          <Card key={service.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {service.name}
                <StatusIcon status={service.status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={service.status === "healthy" ? "success" : "destructive"}
              >
                {service.status === "loading"
                  ? "Checking..."
                  : service.status === "healthy"
                    ? "Operational"
                    : "Degraded"}
              </Badge>

              {readyDetails && service.name.includes("AI Worker") && (
                <div className="mt-4 space-y-2 text-sm">
                  {Object.entries(readyDetails)
                    .filter(([key]) => key !== "status")
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                      >
                        <span className="capitalize text-muted">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                        <Badge variant={value ? "success" : "destructive"}>
                          {value ? "OK" : "Down"}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Architecture Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Redis Cache", desc: "Atomic rate limiting windows" },
              { name: "MongoDB", desc: "Core state & threat logs" },
              { name: "RabbitMQ", desc: "Async threat.eval queue" },
              { name: "Socket.io", desc: "Real-time admin alerts" },
              { name: "Scikit-Learn", desc: "TF-IDF + Naive Bayes" },
              { name: "Ollama Llama 3", desc: "Shadow queue evaluation" },
            ].map((component) => (
              <div
                key={component.name}
                className="rounded-2xl border border-border p-4"
              >
                <p className="font-medium">{component.name}</p>
                <p className="mt-1 text-xs text-muted">{component.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
