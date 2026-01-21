import { MainLayout } from "@/components/layout/main-layout";
import { MaintenanceList } from "./components/maintenance-list";
import { MaintenanceRequestDialog } from "./components/request-dialog";

export default function MaintenancePage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Maintenance</h2>
          <div className="flex items-center space-x-2">
            <MaintenanceRequestDialog />
          </div>
        </div>
        <div className="space-y-4">
          <MaintenanceList />
        </div>
      </div>
    </MainLayout>
  );
}
