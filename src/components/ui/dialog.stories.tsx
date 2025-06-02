import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Radix UI Dialog primitive를 기반으로 구축된 모달 다이얼로그 컴포넌트입니다.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

// 기본 다이얼로그
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">다이얼로그 열기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>다이얼로그 제목</DialogTitle>
          <DialogDescription>
            제목과 설명이 있는 기본 다이얼로그입니다. 여기에 원하는 내용을 넣을
            수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            다이얼로그 내용이 여기에 들어갑니다. 주요 콘텐츠나 폼, 기타 상호작용
            요소들을 이 위치에 배치할 수 있습니다.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button>변경사항 저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// 프로필 편집 폼 다이얼로그
export const ProfileEditForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>프로필 편집</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>프로필 편집</DialogTitle>
          <DialogDescription>
            여기서 프로필을 수정할 수 있습니다. 완료되면 저장 버튼을 클릭하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              이름
            </Label>
            <Input id="name" defaultValue="홍길동" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              사용자명
            </Label>
            <Input
              id="username"
              defaultValue="@honggildong"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              defaultValue="hong@example.com"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button type="submit">변경사항 저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// 확인 다이얼로그
export const ConfirmationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">계정 삭제</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
          <DialogDescription>
            이 작업은 되돌릴 수 없습니다. 계정이 영구적으로 삭제되며 서버에서
            모든 데이터가 제거됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button variant="destructive">네, 계정을 삭제합니다</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// 긴 내용 다이얼로그
export const LargeContentDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">이용약관</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>이용약관</DialogTitle>
          <DialogDescription>
            이용약관을 주의 깊게 읽어주시기 바랍니다.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-4 max-h-[400px]">
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold">1. 소개</h3>
            <p>
              저희 서비스에 오신 것을 환영합니다. 본 이용약관은 저희 웹사이트 및
              서비스 이용에 대한 규칙과 규정을 명시합니다.
            </p>

            <h3 className="font-semibold">2. 약관 동의</h3>
            <p>
              본 서비스에 접근하고 이용함으로써, 귀하는 본 약관의 조건에
              동의하고 구속됨을 승인합니다.
            </p>

            <h3 className="font-semibold">3. 개인정보처리방침</h3>
            <p>
              귀하의 개인정보는 저희에게 중요합니다. 저희 개인정보처리방침은
              서비스 이용 시 정보 수집, 이용, 보호 방법을 설명합니다.
            </p>

            <h3 className="font-semibold">4. 사용자 책임</h3>
            <p>
              사용자는 계정 정보의 기밀성을 유지하고 계정에서 발생하는 모든
              활동에 대한 책임을 집니다.
            </p>

            <h3 className="font-semibold">5. 서비스 가용성</h3>
            <p>
              저희는 서비스를 항상 이용 가능하도록 노력하지만, 중단 없는
              접근이나 운영을 보장하지는 않습니다.
            </p>

            <h3 className="font-semibold">6. 책임 제한</h3>
            <p>
              어떠한 경우에도 저희는 이익, 데이터, 사용, 영업권 또는 기타 무형
              손실의 손해를 포함한 간접적, 부수적, 특별, 결과적 또는 징벌적
              손해에 대해 책임지지 않습니다.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">거부</Button>
          </DialogClose>
          <Button>약관 동의</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// 문의 폼 다이얼로그
export const ContactFormDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>문의하기</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>문의하기</DialogTitle>
          <DialogDescription>
            메시지를 보내주시면 최대한 빠른 시간 내에 답변드리겠습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="contact-name">이름</Label>
            <Input id="contact-name" placeholder="성함을 입력하세요" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-email">이메일</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="이메일 주소를 입력하세요"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-subject">제목</Label>
            <Input id="contact-subject" placeholder="문의 제목을 입력하세요" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-message">내용</Label>
            <Textarea
              id="contact-message"
              placeholder="문의 내용을 입력하세요..."
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button type="submit">메시지 보내기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// 간단한 알림 다이얼로그
export const SimpleAlert: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">알림 보기</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>성공!</DialogTitle>
          <DialogDescription>
            변경사항이 성공적으로 저장되었습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-full">확인</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// 커스텀 너비 다이얼로그
export const CustomWidth: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">넓은 다이얼로그</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>넓은 다이얼로그 예시</DialogTitle>
          <DialogDescription>
            커스텀 너비 설정을 보여주는 다이얼로그입니다.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">왼쪽 컬럼</h3>
              <p className="text-sm text-muted-foreground">
                넓은 다이얼로그의 왼쪽 부분입니다. 폼, 이미지 또는 기타 컴포넌트
                등 원하는 내용을 이곳에 배치할 수 있습니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">오른쪽 컬럼</h3>
              <p className="text-sm text-muted-foreground">
                넓은 다이얼로그의 오른쪽 부분입니다. 2컬럼 레이아웃은 비교
                화면이나 나란히 표시할 콘텐츠에 적합합니다.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
          <Button>계속</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// 헤더 없는 다이얼로그
export const NoHeader: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">미니멀 다이얼로그</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <div className="py-6 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">작업 완료!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            작업이 성공적으로 완료되었습니다. 이제 다음 단계로 진행할 수
            있습니다.
          </p>
          <DialogClose asChild>
            <Button className="w-full">계속</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  ),
};
