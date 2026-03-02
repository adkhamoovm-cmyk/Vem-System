import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Check, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User, StajyorRequest } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "./shared";

export function StajyorTab({ users: allUsers }: { users: User[] }) {
  const { t, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

  const { data: requests = [] } = useQuery<StajyorRequest[]>({ queryKey: ["/api/admin/stajyor-requests"] });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/stajyor-requests/${id}/approve`); },
    onSuccess: () => {
      toast({ title: t("admin.stajyorActivated") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stajyor-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/stajyor-requests/${id}/reject`); },
    onSuccess: () => {
      toast({ title: t("admin.requestRejected") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stajyor-requests"] });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }),
  });

  const filtered = requests.filter(r => filter === "all" || r.status === filter);

  const filterLabels: Record<string, string> = {
    all: t("common.all"),
    pending: t("common.pending"),
    approved: t("common.approved"),
    rejected: t("common.rejected"),
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-5 h-5 text-[#78909C]" />
        <h3 className="text-foreground font-bold text-sm">{t("admin.stajyorRequests")}</h3>
      </div>

      <div className="flex gap-1.5">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? f === "pending" ? "bg-amber-500/15 text-amber-500 border border-amber-500/20" :
                  f === "approved" ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20" :
                  f === "rejected" ? "bg-red-500/15 text-red-500 border border-red-500/20" :
                  "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/50 border border-transparent"
            }`}
            data-testid={`button-filter-stajyor-${f}`}
          >
            {filterLabels[f]}
            <span className="ml-1 opacity-60">({requests.filter(r => f === "all" || r.status === f).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t("admin.nothingFound")}</p>}
        {filtered.map(r => {
          const user = userMap[r.userId];
          return (
            <div key={r.id} className="bg-card rounded-xl p-4 border border-border/50 hover:border-border transition-colors shadow-sm" data-testid={`stajyor-request-${r.id}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <UserPlus className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="text-foreground font-bold text-sm">{user?.phone || r.userId.slice(0, 8)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.message && (
                    <div className="flex items-start gap-1.5 mt-1.5 ml-9 bg-muted/30 rounded-lg p-2.5 border border-border/50">
                      <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-foreground text-xs">{r.message}</p>
                    </div>
                  )}
                  <div className="ml-9 space-y-0.5 mt-1">
                    <p className="text-muted-foreground text-xs">UID: {user?.numericId?.slice(0, 10) || "—"}</p>
                    <p className="text-muted-foreground text-xs">{t("admin.date")}: {new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => approveMutation.mutate(r.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 text-xs rounded-lg shadow-sm" data-testid={`button-approve-stajyor-${r.id}`}
                    >
                      <Check className="w-3 h-3 mr-1" /> {t("admin.activate")}
                    </Button>
                    <Button size="sm" onClick={() => rejectMutation.mutate(r.id)}
                      className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs rounded-lg shadow-sm" data-testid={`button-reject-stajyor-${r.id}`}
                    >
                      <X className="w-3 h-3 mr-1" /> {t("admin.reject")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
