"use client";


import { RefreshCw, Loader2 } from "lucide-react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

interface PageHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function PageHeader({ onRefresh, isRefreshing }: PageHeaderProps) {
  const { userId } = useAuth();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Cronicle Memory Browser</h1>
      <div className="flex items-center gap-2">
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>

        {isRefreshing && (
          <span className="text-sm text-gray-500 flex items-center">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Syncing...
          </span>
        )}
        <div className="h-full flex items-center space-x-4">


          {userId ? (
            <>
              <SignOutButton>
                <Button size="sm" variant="ghost">
                  Sign out
                </Button>
              </SignOutButton>
              <UserButton
                showName={false}
                appearance={{
                  elements: {
                    userButtonBox: "flex-row-reverse",
                  },
                }}
              />
            </>
          ) : (
            <>
              {/* <Link
                  href="/pricing"
                  className={buttonVariants({
                    size: "sm",
                    variant: "ghost",
                  })}
                >
                  Pricing
                </Link> */}
              <Link
                href="/sign-in"
                className={buttonVariants({
                  size: "sm",
                  variant: "ghost",
                })}
              >
                Sign in
              </Link>

              <div className="h-8 w-px bg-gray-200" />

              <Link
                href="/sign-up"
                className={buttonVariants({
                  size: "sm",
                  className: "flex items-center gap-1.5",
                })}
              >
                Sign up <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
