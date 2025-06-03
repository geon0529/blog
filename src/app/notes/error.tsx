"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Notes page error:", error);
  }, [error]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-red-600">
            페이지를 불러오는 중 오류가 발생했습니다
          </h2>
          <p className="text-gray-600 max-w-md">
            {error.message || "알 수 없는 오류가 발생했습니다."}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 font-mono">
              오류 ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Button onClick={reset} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            홈으로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}
