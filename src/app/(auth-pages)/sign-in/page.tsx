"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const urlSuccess = searchParams.get("success");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    } else {
      router.push("/protected");
    }
  };

  return (
    <form onSubmit={handleSignIn} className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">
        {loading ? "로그인 중..." : "로그인"}
      </h1>
      <p className="text-sm text-foreground">
        계정이 없으신가요?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          회원가입
        </Link>
      </p>

      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
        />

        <div className="flex justify-between items-center">
          <Label htmlFor="password">비밀번호</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          required
          disabled={loading}
        />

        <Button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </Button>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* URL에서 온 메시지 (서버 리다이렉트) */}
        {urlError && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-destructive text-sm">{urlError}</p>
          </div>
        )}

        {urlSuccess && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200">
            <p className="text-green-800 text-sm">{urlSuccess}</p>
          </div>
        )}
      </div>
    </form>
  );
}
