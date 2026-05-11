"use client";

import dynamic from "next/dynamic";

const WorkbenchPage = dynamic(() => import("./workbench"), {
  ssr: false,
});

export default function Page() {
  return <WorkbenchPage />;
}
