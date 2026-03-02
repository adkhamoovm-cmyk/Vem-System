import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, BellRing, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export function BroadcastsTab() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushTarget, setPushTarget] = useState<"all" | "single">("all");
  const [pushUserId, setPushUserId] = useState("");

  const { data: broadcastList = [], isLoading } = useQuery<BroadcastItem[]>({
    queryKey: ["/api/admin/broadcasts"],
  });

  const { data: pushStats } = useQuery<{ subscribedUsers: number }>({
    queryKey: ["/api/admin/push-stats"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/broadcasts", { title, message });
    },
    onSuccess: () => {
      toast({ title: t("admin.broadcastSentWithPush") });
      setTitle("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
    },
    onError: (e: Error) => toast({ title: t("admin.broadcastError"), description: e.message, variant: "destructive" }),
  });

  const pushMutation = useMutation({
    mutationFn: async () => {
      const body: { title: string; message: string; targetUserId?: string } = { title: pushTitle, message: pushMessage };
      if (pushTarget === "single" && pushUserId.trim()) {
        body.targetUserId = pushUserId.trim();
      }
      return await apiRequest("POST", "/api/admin/push-send", body);
    },
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: t("admin.pushSent").replace("{count}", String(data.count)) });
      setPushTitle("");
      setPushMessage("");
      setPushUserId("");
    },
    onError: (e: Error) => toast({ title: t("admin.broadcastError"), description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/broadcasts/${id}`);
    },
    onSuccess: () => {
      toast({ title: t("admin.broadcastDeleted") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
    },
    onError: (e: Error) => toast({ title: t("admin.broadcastError"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-2.5 p-4 border-b border-border bg-primary/5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-sm">{t("admin.sendNewBroadcast")}</h3>
            <p className="text-muted-foreground text-[11px]">{t("admin.broadcastDesc")}</p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.broadcastTitle")}</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t("admin.broadcastTitlePlaceholder")}
              className="bg-muted border-border text-foreground h-10 text-sm"
              data-testid="input-broadcast-title"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.broadcastMessageLabel")}</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t("admin.broadcastMessagePlaceholder")}
              rows={4}
              className="w-full bg-muted border border-border text-foreground rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
              data-testid="input-broadcast-message"
            />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !message.trim() || createMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl h-10 text-sm"
            data-testid="button-send-broadcast"
          >
            {createMutation.isPending ? t("admin.broadcastSending") : t("admin.broadcastSendAll")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-2.5 p-4 border-b border-border bg-emerald-500/5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <BellRing className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-sm">{t("admin.pushNotificationSend")}</h3>
            <p className="text-muted-foreground text-[11px]">
              {t("admin.pushSubscribedCount").replace("{count}", String(pushStats?.subscribedUsers ?? 0))}
            </p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setPushTarget("all")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${pushTarget === "all" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
              data-testid="button-push-target-all"
            >
              {t("admin.pushTargetAll")}
            </button>
            <button
              onClick={() => setPushTarget("single")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${pushTarget === "single" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
              data-testid="button-push-target-single"
            >
              {t("admin.pushTargetSingle")}
            </button>
          </div>
          {pushTarget === "single" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.pushUserIdLabel")}</label>
              <Input
                value={pushUserId}
                onChange={e => setPushUserId(e.target.value)}
                placeholder={t("admin.pushUserIdPlaceholder")}
                className="bg-muted border-border text-foreground h-10 text-sm"
                data-testid="input-push-user-id"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.broadcastTitle")}</label>
            <Input
              value={pushTitle}
              onChange={e => setPushTitle(e.target.value)}
              placeholder={t("admin.pushTitlePlaceholder")}
              className="bg-muted border-border text-foreground h-10 text-sm"
              data-testid="input-push-title"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.broadcastMessageLabel")}</label>
            <textarea
              value={pushMessage}
              onChange={e => setPushMessage(e.target.value)}
              placeholder={t("admin.pushMessagePlaceholder")}
              rows={3}
              className="w-full bg-muted border border-border text-foreground rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-emerald-500"
              data-testid="input-push-message"
            />
          </div>
          <Button
            onClick={() => pushMutation.mutate()}
            disabled={!pushTitle.trim() || !pushMessage.trim() || pushMutation.isPending || (pushTarget === "single" && !pushUserId.trim())}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-10 text-sm gap-2"
            data-testid="button-send-push"
          >
            <Send className="w-4 h-4" />
            {pushMutation.isPending ? t("admin.pushSending") : pushTarget === "all" ? t("admin.pushSendAll") : t("admin.pushSendSingle")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-foreground font-bold text-sm">{t("admin.sentMessages")} ({broadcastList.length})</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : broadcastList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{t("admin.noMessagesSent")}</div>
        ) : (
          <div className="divide-y divide-border">
            {broadcastList.map((b: BroadcastItem) => (
              <div key={b.id} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-semibold">{b.title}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2">{b.message}</p>
                  <p className="text-muted-foreground text-[10px] mt-1">{new Date(b.createdAt).toLocaleString("uz-UZ")}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(b.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-500 hover:text-red-600 transition-colors p-1 shrink-0"
                  data-testid={`button-delete-broadcast-${b.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
