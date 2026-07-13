import PortalLayout from "@/components/portal/PortalLayout";

export default function BorrowerRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayout>{children}</PortalLayout>;
}
