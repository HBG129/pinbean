import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { supabase, hasSupabase } from "../lib/supabase";

// ---- bead color palette ----
const BEAD_COLORS = [
  "#f97316", "#ef4444", "#3b82f6", "#22c55e", "#eab308",
  "#a855f7", "#ec4899", "#f43f5e", "#14b8a6", "#f59e0b",
];

// pre-generated floating bead configs (deterministic from color array)
const FLOATING_BEADS = BEAD_COLORS.map((color, i) => {
  const seed = i * 137.5; // deterministic pseudo-random
  return {
    color,
    size: 60 + ((seed * 53) % 100),
    x: ((seed * 97) % 1000) + 50,
    y: ((seed * 187) % 700) + 30,
  };
});

const MAGNETIC_BEADS = [
  { color: "#f97316", leftPct: "5%", topPct: "15%", size: 32 },
  { color: "#22c55e", leftPct: "88%", topPct: "70%", size: 28 },
  { color: "#ef4444", leftPct: "92%", topPct: "20%", size: 24 },
  { color: "#3b82f6", leftPct: "8%", topPct: "75%", size: 30 },
  { color: "#eab308", leftPct: "50%", topPct: "90%", size: 22 },
  { color: "#a855f7", leftPct: "80%", topPct: "40%", size: 26 },
];

// ---- floating blurred bead (pixel-based) ----
function FloatingBead({ color, size, startX, startY }: {
  color: string; size: number; startX: number; startY: number;
}) {
  const x = useMotionValue(startX);
  const y = useMotionValue(startY);
  const sx = useSpring(x, { stiffness: 30, damping: 22 });
  const sy = useSpring(y, { stiffness: 30, damping: 22 });

  useEffect(() => {
    const drift = setInterval(() => {
      x.set(x.get() + (Math.random() - 0.5) * 30);
      y.set(y.get() + (Math.random() - 0.5) * 30);
    }, 2500);
    return () => clearInterval(drift);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        opacity: 0.08,
        left: sx,
        top: sy,
        filter: "blur(16px)",
      }}
    />
  );
}

// ---- solid bead with mouse parallax ----
function MagneticBead({ color, leftPct, topPct, size }: {
  color: string; leftPct: string; topPct: string; size: number;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      mx.set((e.clientX - w / 2) / 35);
      my.set((e.clientY - h / 2) / 35);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  return (
    <motion.div
      className="pointer-events-none absolute rounded-lg shadow-lg"
      style={{
        left: leftPct,
        top: topPct,
        width: size,
        height: size,
        backgroundColor: color,
        x: mx,
        y: my,
        opacity: 0.7,
        rotate: 45,
      }}
    />
  );
}

// ---- main component ----
export function LandingPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(() => localStorage.getItem("pinbean_remember_email") || "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem("pinbean_remember_email")));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSupabase()) return;
    setMsg("");
    setBusy(true);

    try {
      if (tab === "register") {
        // try login first — if email exists, auto-signin
        const { data: signInData, error: signInErr } = await supabase!.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInData.user) {
          // already registered → logged in successfully
          if (remember) localStorage.setItem("pinbean_remember_email", email.trim());
          else localStorage.removeItem("pinbean_remember_email");
          setBusy(false);
          return;
        }
        // not an existing user or wrong password → try sign up
        const { error: signUpError } = await supabase!.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: email.split("@")[0] } },
        });
        if (signUpError) {
          // if user exists but password wrong (from sign-in attempt)
          if (signInErr?.message?.includes("Invalid login")) {
            setMsg("该邮箱已注册，但密码错误。请切换到登录重试。");
          } else {
            throw signUpError;
          }
        } else {
          // new user created and auto-signed in (email confirm disabled)
          if (remember) localStorage.setItem("pinbean_remember_email", email.trim());
          else localStorage.removeItem("pinbean_remember_email");
        }
      } else {
        const { error } = await supabase!.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        if (remember) {
          localStorage.setItem("pinbean_remember_email", email.trim());
        } else {
          localStorage.removeItem("pinbean_remember_email");
        }
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "操作失败";
      setMsg(errMsg.includes("Invalid login") ? "邮箱或密码错误" : errMsg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-[#fef7f0] via-[#f6f3ee] to-[#fef0e7] px-4 dark:from-[#1c1a17] dark:via-[#1c1a17] dark:to-[#1e1815]">
      {/* floating blurred beads */}
      <div className="fixed inset-0 pointer-events-none">
        {FLOATING_BEADS.map((b, i) => (
          <FloatingBead key={i} color={b.color} size={b.size} startX={b.x} startY={b.y} />
        ))}
      </div>

      {/* magnetic solid beads */}
      <div className="fixed inset-0 pointer-events-none">
        {MAGNETIC_BEADS.map((b, i) => (
          <MagneticBead key={i} color={b.color} leftPct={b.leftPct} topPct={b.topPct} size={b.size} />
        ))}
      </div>

      {/* ---- card ---- */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-2xl shadow-orange-200/30 dark:bg-stone-800/80 dark:shadow-black/30">
          {/* logo */}
          <div className="flex justify-center">
            <motion.div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 text-2xl shadow-lg shadow-orange-400/30"
              whileHover={{ scale: 1.05, rotate: -3 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="text-white" size={28} />
            </motion.div>
          </div>

          {/* title */}
          <div className="mt-6 text-center">
            <motion.h1
              className="text-2xl font-black tracking-tight dark:text-stone-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              PinBean 拼豆
            </motion.h1>
            <motion.p
              className="mt-2 text-sm text-stone-500 dark:text-stone-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              把你的照片变成拼豆艺术
            </motion.p>
          </div>

          {/* tab switcher */}
          <motion.div
            className="mt-6 flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setMsg(""); }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
                  tab === t
                    ? "bg-white text-stone-900 shadow-sm dark:bg-stone-600 dark:text-stone-100"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {t === "login" ? "登录" : "注册"}
              </button>
            ))}
          </motion.div>

          {/* form */}
          <motion.form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* email */}
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱地址"
                className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:ring-orange-900/30"
              />
            </div>

            {/* password */}
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码（至少 6 位）"
                minLength={6}
                className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:ring-orange-900/30"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:text-stone-600 dark:hover:text-stone-300"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* remember + forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-stone-500 dark:text-stone-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-orange-500"
                />
                记住密码
              </label>
              {tab === "login" && (
                <button
                  type="button"
                  className="text-stone-400 transition hover:text-orange-500"
                  onClick={() => setMsg("密码重置功能即将上线，请先用注册邮箱重新注册")}
                >
                  忘记密码？
                </button>
              )}
            </div>

            {/* message */}
            <AnimatePresence>
              {msg && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`overflow-hidden rounded-xl px-4 py-2.5 text-sm ${
                    msg.includes("成功")
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {msg}
                </motion.p>
              )}
            </AnimatePresence>

            {/* submit */}
            <motion.button
              type="submit"
              disabled={busy}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-rose-400 py-3.5 font-bold text-white shadow-lg shadow-orange-400/30 transition hover:shadow-orange-400/50 disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {busy ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {tab === "login" ? "登录" : "创建账号"}
                    <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </motion.button>

            {/* divider */}
            {tab === "login" && (
              <p className="text-center text-xs text-stone-400 dark:text-stone-500">
                还没有账号？
                <button
                  type="button"
                  onClick={() => { setTab("register"); setMsg(""); }}
                  className="ml-1 font-bold text-orange-500 transition hover:text-orange-600"
                >
                  立即注册
                </button>
              </p>
            )}
            {tab === "register" && (
              <p className="text-center text-xs text-stone-400 dark:text-stone-500">
                已有账号？
                <button
                  type="button"
                  onClick={() => { setTab("login"); setMsg(""); }}
                  className="ml-1 font-bold text-orange-500 transition hover:text-orange-600"
                >
                  去登录
                </button>
              </p>
            )}
          </motion.form>
        </div>

        {/* footer */}
        <p className="mt-4 text-center text-xs text-stone-400/50 dark:text-stone-600/50">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </motion.div>
    </div>
  );
}
