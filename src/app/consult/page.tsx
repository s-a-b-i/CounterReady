import type { Metadata } from "next";
import { ConsultFlow } from "@/components/consult/ConsultFlow";

export const metadata: Metadata = { title: "Consultation" };

export default function ConsultPage() {
  return <ConsultFlow />;
}
