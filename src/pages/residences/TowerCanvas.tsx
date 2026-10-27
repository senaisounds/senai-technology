import { useEffect, useRef } from "react";
import type { CameraPreset, LightMode } from "./data";
import { createTower, type TowerHandle } from "./tower";

export function TowerCanvas({
  floor,
  mobile,
  reduced,
  active,
  preset,
  light,
  humans,
  onSelect,
}: {
  floor: number;
  mobile: boolean;
  reduced: boolean;
  active: boolean;
  preset: CameraPreset;
  light: LightMode;
  humans: boolean;
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
    tower.setPreset(preset);
    tower.setLight(light);
    tower.setHumans(humans);
    return () => {
      tower.dispose();
      handle.current = null;
    };
    // Scene is rebuilt only when device class or motion preference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, reduced]);

  useEffect(() => {
    handle.current?.setFloor(floor);
  }, [floor]);

  useEffect(() => {
    handle.current?.setPaused(!active);
  }, [active]);

  useEffect(() => {
    handle.current?.setPreset(preset);
  }, [preset]);

  useEffect(() => {
    handle.current?.setLight(light);
  }, [light]);

  useEffect(() => {
    handle.current?.setHumans(humans);
  }, [humans]);

  return (
    <canvas
      ref={ref}
      className="rx-gl"
      aria-label="Interactive Miami-in-Addis luxury tower. Drag to orbit 360 degrees, pinch or scroll to zoom, tap a floor."
    />
  );
}
