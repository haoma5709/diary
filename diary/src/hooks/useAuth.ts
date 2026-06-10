"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const login = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          await supabase.auth.signInWithPassword({
            email: "haoma5709@gmail.com",
            password: "changhao040805",
          });
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
