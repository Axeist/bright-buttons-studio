import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RoomInfo {
  roomEl: HTMLDivElement | null;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface Wave {
  id: string;
  anchorId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  room: string;
}

interface LogEntry {
  id: string;
  message: string;
  time: string;
}

const MOVE_DURATION = 2000;
const ROOM_WANDER_TIME = 10000;
const WANDER_STEP_MS = 40;
const WAVE_INTERVAL = 600;
const WAVE_DURATION = 2600;

const pathSequence = ["gate", "workstation", "canteen", "workstation", "gate"];

export const UWBSimulation = () => {
  const simulationRef = useRef<HTMLDivElement>(null);
  const [employeePos, setEmployeePos] = useState({ x: 0, y: 0 });
  const [currentRoom, setCurrentRoom] = useState("gate");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [roomCenters, setRoomCenters] = useState<Record<string, RoomInfo>>({});
  const [waves, setWaves] = useState<Wave[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const employeeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const wanderIntervalRef = useRef<NodeJS.Timeout>();
  const waveIntervalRef = useRef<NodeJS.Timeout>();

  const calculateRoomCenters = useCallback(() => {
    if (!simulationRef.current) return;

    const simRect = simulationRef.current.getBoundingClientRect();
    const rooms: Record<string, RoomInfo> = {};

    ["gate", "workstation", "canteen"].forEach((roomKey) => {
      const roomEl = simulationRef.current?.querySelector(
        `.room.${roomKey}`
      ) as HTMLDivElement;
      if (roomEl) {
        const rect = roomEl.getBoundingClientRect();
        rooms[roomKey] = {
          roomEl,
          centerX: rect.left - simRect.left + rect.width / 2,
          centerY: rect.top - simRect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        };
      }
    });

    setRoomCenters(rooms);
  }, []);

  const getAnchorPositions = useCallback(
    (roomKey: string): Array<{ x: number; y: number; id: string }> => {
      if (!simulationRef.current) return [];
      const roomEl = simulationRef.current.querySelector(
        `.room.${roomKey}`
      ) as HTMLDivElement;
      if (!roomEl) return [];

      const simRect = simulationRef.current.getBoundingClientRect();
      const anchors = Array.from(roomEl.querySelectorAll(".anchor"));
      const positions: Array<{ x: number; y: number; id: string }> = [];

      anchors.forEach((anchor, index) => {
        const rect = anchor.getBoundingClientRect();
        positions.push({
          x: rect.left - simRect.left + rect.width / 2,
          y: rect.top - simRect.top + rect.height / 2,
          id: `${roomKey}-anchor-${index}`,
        });
      });

      return positions;
    },
    []
  );

  const globalToLocal = useCallback(
    (roomEl: HTMLDivElement, x: number, y: number) => {
      if (!simulationRef.current) return { x: 0, y: 0 };
      const simRect = simulationRef.current.getBoundingClientRect();
      const roomRect = roomEl.getBoundingClientRect();
      return {
        x: x - (roomRect.left - simRect.left),
        y: y - (roomRect.top - simRect.top),
      };
    },
    []
  );

  const getRoomInnerBounds = useCallback(
    (roomKey: string) => {
      const info = roomCenters[roomKey];
      if (!info) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      const padding = 35;
      return {
        minX: info.centerX - info.width / 2 + padding,
        maxX: info.centerX + info.width / 2 - padding,
        minY: info.centerY - info.height / 2 + padding,
        maxY: info.centerY + info.height / 2 - padding,
      };
    },
    [roomCenters]
  );

  const addLog = useCallback((message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), message, time: timeStr },
    ]);
  }, []);

  const spawnWave = useCallback(() => {
    if (!employeeRef.current || !simulationRef.current) return;

    const employeeRect = employeeRef.current.getBoundingClientRect();
    const simRect = simulationRef.current.getBoundingClientRect();
    const employeeX = employeeRect.left - simRect.left + employeeRect.width / 2;
    const employeeY = employeeRect.top - simRect.top + employeeRect.height / 2;

    const anchors = getAnchorPositions(currentRoom);
    if (anchors.length === 0) return;

    // Each anchor emits a wave towards the employee
    anchors.forEach((anchor) => {
      const waveId = `${anchor.id}-${Date.now()}-${Math.random()}`;
      setWaves((prev) => [
        ...prev,
        {
          id: waveId,
          anchorId: anchor.id,
          startX: anchor.x,
          startY: anchor.y,
          endX: employeeX,
          endY: employeeY,
          room: currentRoom,
        },
      ]);

      // Remove wave after animation
      setTimeout(() => {
        setWaves((prev) => prev.filter((w) => w.id !== waveId));
      }, WAVE_DURATION);
    });
  }, [currentRoom, getAnchorPositions]);

  const startWaveLoop = useCallback(() => {
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
    }
    waveIntervalRef.current = setInterval(() => {
      spawnWave();
    }, WAVE_INTERVAL);
  }, [spawnWave]);

  const startRoomWander = useCallback(
    (roomKey: string, callbackAfterWander: () => void) => {
      if (wanderIntervalRef.current) {
        clearInterval(wanderIntervalRef.current);
      }

      const roomInfo = roomCenters[roomKey];
      if (!roomInfo) return;

      const bounds = getRoomInnerBounds(roomKey);
      let elapsed = 0;

      wanderIntervalRef.current = setInterval(() => {
        elapsed += WANDER_STEP_MS;
        if (!employeeRef.current || !simulationRef.current) return;

        const current = employeeRef.current.getBoundingClientRect();
        const simRect = simulationRef.current.getBoundingClientRect();
        let cx = current.left - simRect.left + current.width / 2;
        let cy = current.top - simRect.top + current.height / 2;

        const maxStep = 12;
        cx += (Math.random() * 2 - 1) * maxStep;
        cy += (Math.random() * 2 - 1) * maxStep;

        cx = Math.max(bounds.minX, Math.min(bounds.maxX, cx));
        cy = Math.max(bounds.minY, Math.min(bounds.maxY, cy));

        const roomEl = roomInfo.roomEl;
        if (roomEl) {
          const local = globalToLocal(roomEl, cx, cy);
          setEmployeePos({ x: local.x, y: local.y });
        }

        if (elapsed >= ROOM_WANDER_TIME) {
          clearInterval(wanderIntervalRef.current);
          wanderIntervalRef.current = undefined;
          callbackAfterWander();
        }
      }, WANDER_STEP_MS);
    },
    [roomCenters, getRoomInnerBounds, globalToLocal]
  );

  const animateToNextRoom = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    const fromKey = pathSequence[currentSegmentIndex];
    const toKey = pathSequence[(currentSegmentIndex + 1) % pathSequence.length];

    const from = roomCenters[fromKey];
    const to = roomCenters[toKey];

    if (!from || !to) {
      setIsAnimating(false);
      return;
    }

    const simRect = simulationRef.current?.getBoundingClientRect();
    if (!simRect || !employeeRef.current) {
      setIsAnimating(false);
      return;
    }

    const tagRect = employeeRef.current.getBoundingClientRect();
    const startX = tagRect.left - simRect.left + tagRect.width / 2;
    const startY = tagRect.top - simRect.top + tagRect.height / 2;

    const endX = to.centerX;
    const endY = to.centerY;

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / MOVE_DURATION, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const currentX = startX + (endX - startX) * eased;
      const currentY = startY + (endY - startY) * eased;

      if (to.roomEl) {
        const local = globalToLocal(to.roomEl, currentX, currentY);
        setEmployeePos({ x: local.x, y: local.y });
      }

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        setCurrentRoom(toKey);
        const roomName = to.roomEl?.getAttribute("data-room") || "Room";
        addLog(`Entered ${roomName}`);
        setCurrentSegmentIndex(
          (prev) => (prev + 1) % pathSequence.length
        );
        setIsAnimating(false);

        startRoomWander(toKey, () => {
          animateToNextRoom();
        });
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, [
    currentSegmentIndex,
    roomCenters,
    isAnimating,
    globalToLocal,
    addLog,
    startRoomWander,
  ]);

  const createTagAtCenter = useCallback(
    (roomKey: string) => {
      const info = roomCenters[roomKey];
      if (!info || !info.roomEl) return;

      const localPos = globalToLocal(info.roomEl, info.centerX, info.centerY);
      setEmployeePos({ x: localPos.x, y: localPos.y });
      setCurrentRoom(roomKey);

      const roomName = info.roomEl.getAttribute("data-room") || "Room";
      addLog(`Entered ${roomName}`);
    },
    [roomCenters, globalToLocal, addLog]
  );

  useEffect(() => {
    calculateRoomCenters();
    window.addEventListener("resize", calculateRoomCenters);
    return () => {
      window.removeEventListener("resize", calculateRoomCenters);
      if (wanderIntervalRef.current) clearInterval(wanderIntervalRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [calculateRoomCenters]);

  useEffect(() => {
    if (Object.keys(roomCenters).length > 0 && !isAnimating) {
      createTagAtCenter("gate");
      startWaveLoop();
      startRoomWander("gate", () => {
        animateToNextRoom();
      });
    }
  }, [roomCenters, createTagAtCenter, startWaveLoop, startRoomWander, animateToNextRoom, isAnimating]);

  const getRays = () => {
    if (!employeeRef.current || !simulationRef.current) return [];
    const employeeRect = employeeRef.current.getBoundingClientRect();
    const simRect = simulationRef.current.getBoundingClientRect();
    const tx = employeeRect.left - simRect.left + employeeRect.width / 2;
    const ty = employeeRect.top - simRect.top + employeeRect.height / 2;

    const anchors = getAnchorPositions(currentRoom);
    return anchors.map((anchor) => {
      const dx = tx - anchor.x;
      const dy = ty - anchor.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

      return {
        id: anchor.id,
        x: anchor.x,
        y: anchor.y,
        distance: dist,
        angle: angleDeg + 90,
      };
    });
  };

  const rays = getRays();

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#0A1A2F] text-white overflow-hidden p-4">
      <div className="w-[95vw] h-[90vh] border border-[rgba(48,227,223,0.4)] grid grid-cols-[2fr_1fr] gap-4 p-4 bg-[radial-gradient(circle_at_top,#112244_0,#050815_55%,#02040a_100%)] shadow-[0_0_25px_rgba(0,0,0,0.7)]">
        {/* Simulation Area */}
        <div
          ref={simulationRef}
          className="relative grid grid-rows-2 grid-cols-2 gap-4"
        >
          {/* Gate Room */}
          <div className="room gate relative border-2 border-[#30E3DF] rounded-lg shadow-[0_0_12px_rgba(48,227,223,0.5)] bg-[radial-gradient(circle_at_top_left,rgba(48,227,223,0.06),transparent_60%)] overflow-hidden" data-room="Gate Room">
            <div className="absolute left-3 top-2.5 px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wide bg-[rgba(5,12,32,0.9)] border border-[rgba(48,227,223,0.7)] text-[#EFFFFF] shadow-[0_0_6px_rgba(48,227,223,0.8)]">
              Gate Room
            </div>
            <div className="absolute right-3 bottom-2 text-[11px] opacity-55 uppercase tracking-wide">
              Entry / Exit
            </div>
            <div className="anchors-layer absolute inset-0 pointer-events-none">
              <div className="anchor tl absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] top-1.5 left-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor tr absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] top-1.5 right-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor bl absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] bottom-1.5 left-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor br absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] bottom-1.5 right-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
            </div>
            <div className="waves-layer absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {waves
                  .filter((w) => w.room === "gate")
                  .map((wave) => (
                    <motion.div
                      key={wave.id}
                      className="wave absolute rounded-full border border-[rgba(178,102,255,0.9)] pointer-events-none"
                      initial={{
                        left: wave.startX,
                        top: wave.startY,
                        width: 0,
                        height: 0,
                        opacity: 0.7,
                      }}
                      animate={{
                        left: wave.endX,
                        top: wave.endY,
                        width: 150,
                        height: 150,
                        opacity: 0,
                      }}
                      transition={{
                        duration: WAVE_DURATION / 1000,
                        ease: "linear",
                      }}
                      style={{
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
              </AnimatePresence>
            </div>
            <div className="lines-layer absolute inset-0 pointer-events-none">
              {currentRoom === "gate" &&
                rays
                  .filter((r) => r.id.startsWith("gate-"))
                  .map((ray) => (
                    <div
                      key={ray.id}
                      className="ray absolute w-px bg-gradient-to-b from-transparent via-[rgba(48,227,223,0.7)] to-transparent opacity-65 pointer-events-none"
                      style={{
                        left: `${ray.x}px`,
                        top: `${ray.y}px`,
                        height: `${ray.distance}px`,
                        transform: `translateX(-50%) rotate(${ray.angle}deg)`,
                        transformOrigin: "top center",
                      }}
                    />
                  ))}
            </div>
            {currentRoom === "gate" && (
              <div className="tag-layer absolute inset-0 pointer-events-none">
                <motion.div
                  ref={employeeRef}
                  className="employee-tag absolute w-4 h-4 rounded-full bg-[#3DFF88] shadow-[0_0_10px_rgba(61,255,136,1),0_0_22px_rgba(61,255,136,0.9),0_0_32px_rgba(61,255,136,0.8)] z-10"
                  style={{
                    left: `${employeePos.x}px`,
                    top: `${employeePos.y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="absolute inset-1 rounded-full bg-[radial-gradient(circle,#f4fff9_0%,#3DFF88_40%,#0A1A2F_80%)]" />
                </motion.div>
              </div>
            )}
          </div>

          {/* Workstation Room */}
          <div className="room workstation relative border-2 border-[#30E3DF] rounded-lg shadow-[0_0_12px_rgba(48,227,223,0.5)] bg-[radial-gradient(circle_at_top_left,rgba(48,227,223,0.06),transparent_60%)] overflow-hidden col-span-1 row-span-2" data-room="Workstation Room">
            <div className="absolute left-3 top-2.5 px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wide bg-[rgba(5,12,32,0.9)] border border-[rgba(48,227,223,0.7)] text-[#EFFFFF] shadow-[0_0_6px_rgba(48,227,223,0.8)]">
              Workstation Room
            </div>
            <div className="absolute right-3 bottom-2 text-[11px] opacity-55 uppercase tracking-wide">
              Production Zone
            </div>
            <div className="anchors-layer absolute inset-0 pointer-events-none">
              <div className="anchor tl absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] top-1.5 left-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor tr absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] top-1.5 right-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor bl absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] bottom-1.5 left-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor br absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] bottom-1.5 right-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
            </div>
            <div className="waves-layer absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {waves
                  .filter((w) => w.room === "workstation")
                  .map((wave) => (
                    <motion.div
                      key={wave.id}
                      className="wave absolute rounded-full border border-[rgba(178,102,255,0.9)] pointer-events-none"
                      initial={{
                        left: wave.startX,
                        top: wave.startY,
                        width: 0,
                        height: 0,
                        opacity: 0.7,
                      }}
                      animate={{
                        left: wave.endX,
                        top: wave.endY,
                        width: 150,
                        height: 150,
                        opacity: 0,
                      }}
                      transition={{
                        duration: WAVE_DURATION / 1000,
                        ease: "linear",
                      }}
                      style={{
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
              </AnimatePresence>
            </div>
            <div className="lines-layer absolute inset-0 pointer-events-none">
              {currentRoom === "workstation" &&
                rays
                  .filter((r) => r.id.startsWith("workstation-"))
                  .map((ray) => (
                    <div
                      key={ray.id}
                      className="ray absolute w-px bg-gradient-to-b from-transparent via-[rgba(48,227,223,0.7)] to-transparent opacity-65 pointer-events-none"
                      style={{
                        left: `${ray.x}px`,
                        top: `${ray.y}px`,
                        height: `${ray.distance}px`,
                        transform: `translateX(-50%) rotate(${ray.angle}deg)`,
                        transformOrigin: "top center",
                      }}
                    />
                  ))}
            </div>
            {currentRoom === "workstation" && (
              <div className="tag-layer absolute inset-0 pointer-events-none">
                <motion.div
                  ref={employeeRef}
                  className="employee-tag absolute w-4 h-4 rounded-full bg-[#3DFF88] shadow-[0_0_10px_rgba(61,255,136,1),0_0_22px_rgba(61,255,136,0.9),0_0_32px_rgba(61,255,136,0.8)] z-10"
                  style={{
                    left: `${employeePos.x}px`,
                    top: `${employeePos.y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="absolute inset-1 rounded-full bg-[radial-gradient(circle,#f4fff9_0%,#3DFF88_40%,#0A1A2F_80%)]" />
                </motion.div>
              </div>
            )}
          </div>

          {/* Canteen Room */}
          <div className="room canteen relative border-2 border-[#30E3DF] rounded-lg shadow-[0_0_12px_rgba(48,227,223,0.5)] bg-[radial-gradient(circle_at_top_left,rgba(48,227,223,0.06),transparent_60%)] overflow-hidden" data-room="Canteen Room">
            <div className="absolute left-3 top-2.5 px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wide bg-[rgba(5,12,32,0.9)] border border-[rgba(48,227,223,0.7)] text-[#EFFFFF] shadow-[0_0_6px_rgba(48,227,223,0.8)]">
              Canteen Room
            </div>
            <div className="absolute right-3 bottom-2 text-[11px] opacity-55 uppercase tracking-wide">
              Break / Refresh
            </div>
            <div className="anchors-layer absolute inset-0 pointer-events-none">
              <div className="anchor tl absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] top-1.5 left-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor tr absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] top-1.5 right-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor bl absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] bottom-1.5 left-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
              <div className="anchor br absolute w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_6px_rgba(48,227,223,0.9),0_0_14px_rgba(48,227,223,0.8)] bottom-1.5 right-1.5 after:content-[''] after:absolute after:inset-[-5px] after:rounded-full after:border after:border-[rgba(48,227,223,0.35)]" />
            </div>
            <div className="waves-layer absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {waves
                  .filter((w) => w.room === "canteen")
                  .map((wave) => (
                    <motion.div
                      key={wave.id}
                      className="wave absolute rounded-full border border-[rgba(178,102,255,0.9)] pointer-events-none"
                      initial={{
                        left: wave.startX,
                        top: wave.startY,
                        width: 0,
                        height: 0,
                        opacity: 0.7,
                      }}
                      animate={{
                        left: wave.endX,
                        top: wave.endY,
                        width: 150,
                        height: 150,
                        opacity: 0,
                      }}
                      transition={{
                        duration: WAVE_DURATION / 1000,
                        ease: "linear",
                      }}
                      style={{
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
              </AnimatePresence>
            </div>
            <div className="lines-layer absolute inset-0 pointer-events-none">
              {currentRoom === "canteen" &&
                rays
                  .filter((r) => r.id.startsWith("canteen-"))
                  .map((ray) => (
                    <div
                      key={ray.id}
                      className="ray absolute w-px bg-gradient-to-b from-transparent via-[rgba(48,227,223,0.7)] to-transparent opacity-65 pointer-events-none"
                      style={{
                        left: `${ray.x}px`,
                        top: `${ray.y}px`,
                        height: `${ray.distance}px`,
                        transform: `translateX(-50%) rotate(${ray.angle}deg)`,
                        transformOrigin: "top center",
                      }}
                    />
                  ))}
            </div>
            {currentRoom === "canteen" && (
              <div className="tag-layer absolute inset-0 pointer-events-none">
                <motion.div
                  ref={employeeRef}
                  className="employee-tag absolute w-4 h-4 rounded-full bg-[#3DFF88] shadow-[0_0_10px_rgba(61,255,136,1),0_0_22px_rgba(61,255,136,0.9),0_0_32px_rgba(61,255,136,0.8)] z-10"
                  style={{
                    left: `${employeePos.x}px`,
                    top: `${employeePos.y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="absolute inset-1 rounded-full bg-[radial-gradient(circle,#f4fff9_0%,#3DFF88_40%,#0A1A2F_80%)]" />
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Log Panel */}
        <div className="rounded-[10px] p-3.5 bg-[radial-gradient(circle_at_top,#101b3a_0,#050816_55%,#02030a_100%)] border border-[rgba(48,227,223,0.5)] shadow-[0_0_20px_rgba(0,0,0,0.7),0_0_18px_rgba(48,227,223,0.3)] flex flex-col min-w-[260px]">
          <div className="text-[15px] uppercase tracking-[0.08em] mb-1 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#30E3DF] shadow-[0_0_8px_rgba(48,227,223,0.9)]" />
            SEMMS Live Events
          </div>
          <div className="text-[11px] opacity-65 mb-1.5">
            Real-time employee transitions with UWB anchor communication
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(48,227,223,0.7)] to-transparent my-2 mb-2.5" />
          <div className="flex-1 overflow-y-auto text-xs pr-1 scrollbar-thin scrollbar-thumb-[rgba(48,227,223,0.6)] scrollbar-track-[rgba(3,6,18,0.9)]">
            {logs.map((log) => (
              <div
                key={log.id}
                className="mb-1.5 px-1.5 py-1 rounded-md bg-[rgba(7,19,52,0.9)] border border-[rgba(48,227,223,0.3)] shadow-[0_0_8px_rgba(0,0,0,0.5)] flex justify-between gap-2.5 items-center"
              >
                <span className="text-[#EFFFFF]">{log.message}</span>
                <span className="text-[11px] opacity-70 whitespace-nowrap">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
