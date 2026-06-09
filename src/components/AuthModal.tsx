import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";

type Props = { open: boolean; onClose: () => void };

export function AuthModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      if (tab === "register") {
        const { error } = await supabase!.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("注册成功！请检查邮箱确认链接，或直接登录。");
        setTab("login");
      } else {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "出错了");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-stone-800"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-100 dark:hover:bg-stone-700"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-black dark:text-stone-100">
              {tab === "login" ? "登录 PinBean" : "注册 PinBean"}
            </h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {tab === "login" ? "欢迎回来" : "创建账号，保存你的拼豆作品"}
            </p>

            {/* tab switcher */}
            <div className="mt-5 flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-700">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setMsg(""); }}
                  className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                    tab === t
                      ? "bg-white text-stone-900 shadow dark:bg-stone-600 dark:text-stone-100"
                      : "text-stone-500"
                  }`}
                >
                  {t === "login" ? "登录" : "注册"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium dark:text-stone-200">邮箱</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none transition focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-stone-200">密码</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none transition focus:border-orange-400 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
                  placeholder="至少 6 位"
                />
              </div>

              {msg && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-xl px-4 py-2 text-sm ${msg.includes("成功") ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"}`}
                >
                  {msg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-2xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 active:scale-[0.97] disabled:opacity-60"
              >
                {busy ? "处理中..." : tab === "login" ? "登录" : "注册"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
