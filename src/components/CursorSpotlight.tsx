import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export function CursorSpotlight() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 50, damping: 26 });
  const sy = useSpring(mouseY, { stiffness: 50, damping: 26 });
  const sx2 = useSpring(sx, { stiffness: 30, damping: 32 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* primary warm orange glow */}
      <motion.div
        className="pointer-events-none absolute h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] dark:opacity-[0.08]"
        style={{
          left: sx,
          top: sy,
          background: "radial-gradient(circle, #f97316 0%, #f9731600 70%)",
        }}
      />
      {/* secondary slightly-delayed glow */}
      <motion.div
        className="pointer-events-none absolute h-[350px] w-[350px] rounded-full opacity-[0.04] dark:opacity-[0.06]"
        style={{
          left: sx2,
          top: sy,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, #fb923c 0%, #fb923c00 70%)",
        }}
      />
    </div>
  );
}
