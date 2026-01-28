import React, { Suspense } from "react";
import ProfileContent from "./components/ProfileContent";


export default function ProfilePage() {
  return (
    <Suspense fallback={
        <div className="h-full overflow-y-auto bg-brand-50 flex flex-col relative">
             <div className="absolute top-0 left-0 w-full h-64 bg-slate-200 animate-pulse z-0" />
        </div>
    }>
        <ProfileContent />
    </Suspense>
  );
}
