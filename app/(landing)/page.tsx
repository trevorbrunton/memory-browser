import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { Heading } from "@/components/heading";
import { ShinyButton } from "@/components/shiny-button";
import { Check } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";



export default async function LandingPage() {
  const auth = await currentUser();
  if (auth) {
    redirect("/home");
  }

  return (
    <>
      {/* Hero section */}
      <section className="relative sm:py-24 py-6">
        <MaxWidthWrapper className="text-center">
          <div className="relative mx-auto text-center flex flex-col items-center gap-10">
            <img src="/front-page.jpg" alt="Hero image" className="w-60 sm:w-60 rounded" />
            <div>
              <Heading>
                <span>Create and tell</span>
                <br />
                <span className="relative bg-gradient-to-r from-brand-700 to-brand-800 text-transparent bg-clip-text">
                  your story
                </span>
              </Heading>
            </div>



            <ul className="space-y-2 text-base/7 text-gray-600 text-left flex flex-col items-start">
              {[
                "Safe and secure",
                "Share with friends and family",
                "Tell your story, your way",
              ].map((item, index) => (
                <li key={index} className="flex gap-1.5 items-center text-left">
                  <Check className="size-5 shrink-0 text-brand-700" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="w-full max-w-80">
              <ShinyButton
                href="/sign-up"
                className="relative z-10 h-14 w-full text-base shadow-lg transition-shadow duration-300 hover:shadow-xl"
              >
                Start For Free Today
              </ShinyButton>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
     
    </>
  );
}
