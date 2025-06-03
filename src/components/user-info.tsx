"use client";

import { User } from "@supabase/supabase-js";
import { useEffect } from "react";

interface UserInfoProps {
  user: User;
}

export default function UserInfo({ user }: UserInfoProps) {
  useEffect(() => {
    console.log("하이킥 user", user);
  }, [user]);
  return <div>유저 정보</div>;
}
