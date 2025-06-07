"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  // This will now construct a redirect URL to the welcome page,
  // carrying the intent along.
  const redirectUrl = intent ? `/welcome?intent=${intent}` : "/welcome";

  return (
    <div className="w-full flex-1 flex items-center justify-center">
      <SignIn forceRedirectUrl={redirectUrl} />
    </div>
  );
};

export default Page;
