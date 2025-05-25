import { ArrowUpRight, InfoIcon } from "lucide-react";
import Link from "next/link";

export function SmtpMessage() {
  return (
    <div className="bg-muted/50 px-5 py-3 border rounded-md flex gap-4">
      <InfoIcon size={16} className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <small className="text-sm text-secondary-foreground">
          <strong>참고:</strong> 이메일 전송에 제한이 있습니다. 전송 제한을
          늘리려면 사용자 정의 SMTP를 활성화하세요.
        </small>
        <div>
          <Link
            href="https://supabase.com/docs/guides/auth/auth-smtp"
            target="_blank"
            className="text-primary/50 hover:text-primary flex items-center text-sm gap-1"
          >
            자세히 알아보기 <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
