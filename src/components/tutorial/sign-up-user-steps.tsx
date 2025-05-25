import Link from "next/link";
import { TutorialStep } from "./tutorial-step";
import { ArrowUpRight } from "lucide-react";

export default function SignUpUserSteps() {
  return (
    <ol className="flex flex-col gap-6">
      {process.env.VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "production" ? (
        <TutorialStep title="리다이렉트 URL 설정">
          <p>이 앱이 Vercel에 호스팅되어 있는 것 같습니다.</p>
          <p className="mt-4">
            이 특정 배포는
            <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
              "{process.env.VERCEL_ENV}"
            </span>
            환경이며
            <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
              https://{process.env.VERCEL_URL}
            </span>
            에 있습니다.
          </p>
          <p className="mt-4">
            Vercel 배포 URL을 기반으로
            <Link
              className="text-primary hover:text-foreground"
              href={
                "https://supabase.com/dashboard/project/_/auth/url-configuration"
              }
            >
              Supabase 프로젝트를 업데이트
            </Link>
            하여 리다이렉트 URL을 설정해야 합니다.
          </p>
          <ul className="mt-4">
            <li>
              -
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                http://localhost:3000/**
              </span>
            </li>
            <li>
              -
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                {`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/**`}
              </span>
            </li>
            <li>
              -
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                {`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(".vercel.app", "")}-*-[vercel-team-url].vercel.app/**`}
              </span>
              (Vercel 팀 URL은
              <Link
                className="text-primary hover:text-foreground"
                href="https://vercel.com/docs/accounts/create-a-team#find-your-team-id"
                target="_blank"
              >
                Vercel 팀 설정
              </Link>
              에서 찾을 수 있습니다)
            </li>
          </ul>
          <Link
            href="https://supabase.com/docs/guides/auth/redirect-urls#vercel-preview-urls"
            target="_blank"
            className="text-primary/50 hover:text-primary flex items-center text-sm gap-1 mt-4"
          >
            리다이렉트 URL 문서 <ArrowUpRight size={14} />
          </Link>
        </TutorialStep>
      ) : null}
      <TutorialStep title="첫 번째 사용자 회원가입">
        <p>
          <Link
            href="/sign-up"
            className="font-bold hover:underline text-foreground/80"
          >
            회원가입
          </Link>
          페이지로 이동하여 첫 번째 사용자를 등록하세요. 지금은 본인만 등록해도
          괜찮습니다. 당신의 멋진 아이디어는 나중에 많은 사용자를 얻게 될
          것입니다!
        </p>
      </TutorialStep>
    </ol>
  );
}
