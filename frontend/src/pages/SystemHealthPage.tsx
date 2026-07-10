import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGatewayHealth, getAiWorkerHealth } from "@/services/api";
import { cn } from "@/lib/utils";

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
                        className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2"
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
              { name: "Redis Cache", desc: "Atomic rate limiting windows", group: "gateway" },
              { name: "MongoDB", desc: "Core state & threat logs", group: "gateway" },
              { name: "RabbitMQ", desc: "Async threat.eval queue", group: "gateway" },
              { name: "Socket.io", desc: "Real-time admin alerts", group: "gateway" },
              { name: "Scikit-Learn", desc: "TF-IDF + Naive Bayes", group: "worker" },
              { name: "Ollama Llama 3", desc: "Shadow queue evaluation", group: "worker" },
            ].map((component) => {
              const serviceStatus = component.group === "worker"
                ? services.find(s => s.name === "FastAPI AI Worker")?.status
                : services.find(s => s.name === "Node.js Edge Gateway")?.status;
                
              const isHealthy = serviceStatus === "healthy";
              const isLoading = serviceStatus === "loading";

              return (
                <div
                  key={component.name}
                  className={cn(
                    "rounded-2xl border p-4 transition-all duration-300 relative overflow-hidden group",
                    isLoading ? "border-border bg-surface" :
                    isHealthy 
                      ? "border-accent-green/30 bg-accent-green/5 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                      : "border-red-500/30 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  )}
                >
                  <p className="font-medium text-primary flex items-center justify-between">
                    {component.name}
                    {!isLoading && (
                      <span className={cn("h-2 w-2 rounded-full", isHealthy ? "bg-accent-green animate-pulse" : "bg-red-500")} />
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted">{component.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
