import { useEffect, useRef } from "react";
import { createTower, type TowerHandle } from "./tower";

export function TowerCanvas({
  floor,
  mobile,
  reduced,
  active,
  onSelect,
}: {
  floor: number;
  mobile: boolean;
  reduced: boolean;
  active: boolean;
  onSelect: (n: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const handle = useRef<TowerHandle | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const tower = createTower(canvas, {
      mobile,
      reduced,
      onSelect: (n) => select.current(n),
    });
    handle.current = tower;
    tower.setPaused(!active);
    return () => {
      tower.dispose();
      handle.current = null;
    };
  }, [mobile, reduced]);

  useEffect(() => {
    handle.current?.setFloor(floor);
  }, [floor]);

  useEffect(() => {
    handle.current?.setPaused(!active);
  }, [active]);

  return <canvas ref={ref} className="rx-gl" aria-label="Interactive apartment tower" />;
}
