import { useEffect, useRef } from "react";
import type { FluxAudio } from "./audio";
import { createSignalField, type FieldHandle } from "./signalField";

export function FieldCanvas({
  active,
  soundOn,
  mobile,
  audio,
}: {
  active: boolean;
  soundOn: boolean;
  mobile: boolean;
  audio: FluxAudio | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const handle = useRef<FieldHandle | null>(null);
  const ptr = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const field = createSignalField(canvas, { mobile });
    handle.current = field;
    field.setPaused(!active);
    let raf = 0;
    const loop = () => {
      const l = audio?.getLevels();
      if (l) field.setLevels(l);
      field.setPointer(ptr.current.x, ptr.current.y);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ptr.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onResize = () => field.resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      field.dispose();
      handle.current = null;
    };
  }, [audio, mobile]);

  useEffect(() => {
    handle.current?.setEnabled(soundOn);
  }, [soundOn]);

  useEffect(() => {
    handle.current?.setPaused(!active);
  }, [active]);

  return <canvas ref={ref} className="dj-gl" aria-hidden />;
}
