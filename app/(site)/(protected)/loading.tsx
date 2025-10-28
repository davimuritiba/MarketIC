import { LoadingScreen } from "@/components/loading-screen";

export default function ProtectedSiteLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <LoadingScreen />
    </div>
  );
}