"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@supabase/supabase-js";
import { CircleUserRound } from "lucide-react";

/* 
  {
    "id": "eb23a326-1ac2-45e2-8c74-171712f960be",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "geon0529@gmail.com",
    "email_confirmed_at": "2025-05-23T18:07:52.477671Z",
    "phone": "",
    "confirmation_sent_at": "2025-05-23T18:07:34.813031Z",
    "confirmed_at": "2025-05-23T18:07:52.477671Z",
    "last_sign_in_at": "2025-06-02T02:55:06.458251Z",
    "app_metadata": {
        "provider": "email",
        "providers": [
            "email"
        ]
    },
    "user_metadata": {
        "email": "geon0529@gmail.com",
        "email_verified": true,
        "phone_verified": false,
        "sub": "eb23a326-1ac2-45e2-8c74-171712f960be"
    },
    "identities": [
        {
            "identity_id": "360dbd72-0d15-4c68-9c22-fe84f724766b",
            "id": "eb23a326-1ac2-45e2-8c74-171712f960be",
            "user_id": "eb23a326-1ac2-45e2-8c74-171712f960be",
            "identity_data": {
                "email": "geon0529@gmail.com",
                "email_verified": true,
                "phone_verified": false,
                "sub": "eb23a326-1ac2-45e2-8c74-171712f960be"
            },
            "provider": "email",
            "last_sign_in_at": "2025-05-23T18:07:34.798712Z",
            "created_at": "2025-05-23T18:07:34.798763Z",
            "updated_at": "2025-05-23T18:07:34.798763Z",
            "email": "geon0529@gmail.com"
        }
    ],
    "created_at": "2025-05-23T18:07:34.77755Z",
    "updated_at": "2025-06-03T15:13:59.201564Z",
    "is_anonymous": false
}
  */
interface UserInfoProps {
  user: User;
}

export default function UserInfo({ user }: UserInfoProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <CircleUserRound size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuItem disabled>API</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
