"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const login = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInWithPassword({
          email: "haoma5709@gmail.com",
          password: "changhao040805",
        });
      }
      setReady(true);
    };
    login();
  }, []);

  return { ready };
}
