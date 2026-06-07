"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

function chime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const play = (freq: number, start: number, dur: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };
    play(880, 0, 0.22);
    play(1175, 0.16, 0.26);
    setTimeout(() => ctx.close(), 700);
  } catch {
    /* audio unavailable */
  }
}

/**
 * Polls the latest ticket message and chimes on a new one.
 * - side "client": chimes on admin replies.
 * - side "admin": chimes on client messages.
 * RLS scopes the query to what the viewer is allowed to see.
 */
export function TicketSound({ side }: { side: "client" | "admin" }) {
  const lastId = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const wantFromAdmin = side === "client";
    let stopped = false;

    async function poll() {
      const { data } = await supabase
        .from("ticket_messages")
        .select("id, from_admin, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data || stopped) return;

      if (!initialized.current) {
        initialized.current = true;
        lastId.current = data.id;
        return;
      }
      if (data.id !== lastId.current) {
        const relevant = wantFromAdmin ? data.from_admin : !data.from_admin;
        lastId.current = data.id;
        if (relevant) chime();
      }
    }

    poll();
    const t = setInterval(poll, 20000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [side]);

  return null;
}
