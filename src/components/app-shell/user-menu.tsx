"use client";

import { ChevronDownIcon, LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/features/auth/actions";

const initialCharacter = (word: string) =>
  Array.from(word).find((character) => /[\p{L}\p{N}]/u.test(character));

export function getUserInitials(displayName: string) {
  const initials = displayName
    .trim()
    .split(/\s+/u)
    .map(initialCharacter)
    .filter((character): character is string => Boolean(character))
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase();

  return initials || "AA";
}

type UserMenuProps = Readonly<{
  displayName: string;
  email: string;
  roleName: string;
}>;

export function UserMenu({ displayName, email, roleName }: UserMenuProps) {
  const initials = getUserInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-9 max-w-56 justify-start px-1.5"
            aria-label={`Open user menu for ${displayName}`}
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 flex-col items-start text-left lg:flex">
          <span className="max-w-32 truncate text-xs font-medium">
            {displayName}
          </span>
          <span className="max-w-32 truncate text-[0.65rem] text-muted-foreground">
            {roleName}
          </span>
        </span>
        <ChevronDownIcon data-icon="inline-end" className="hidden lg:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col items-start gap-1.5 px-2 py-2">
            <span className="max-w-full truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="max-w-full truncate font-normal text-muted-foreground">
              {email}
            </span>
            <Badge variant="secondary">{roleName}</Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <form action={signOutAction}>
            <DropdownMenuItem
              render={<button type="submit" className="w-full" />}
              nativeButton
            >
              <LogOutIcon aria-hidden="true" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
