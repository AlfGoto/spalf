import { Suspense } from "react";
import { VerifyPage } from "@/features/auth";

function VerifyPageContent() {
  return <VerifyPage />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
