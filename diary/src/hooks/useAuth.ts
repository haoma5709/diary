"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { withTimeout } from "@/lib/timeout";

export function useAuth() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const login = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          await withTimeout(
            supabase.auth.signInWithPassword({
              email: "haoma5709@gmail.com",
              password: "changhao040805",
            }),
            12000
          );
        }
      } catch (e) {
        console.error("auth error:", e);
      } finally {
        setReady(true);
      }
    };
    login();
  }, []);

  return { ready };
}
