"use client";

import { useSpa, type ViewKey } from "./SpaShell";
import { DashboardView } from "./views/DashboardView";
import { DailyEntriesView } from "./views/DailyEntriesView";
import { MembersView } from "./views/MembersView";
import { PlansView } from "./views/PlansView";
import { AppointmentsView } from "./views/AppointmentsView";
import { ServicesView } from "./views/ServicesView";
import { PaymentsView } from "./views/PaymentsView";
import { PackagesView } from "./views/PackagesView";
import { StaffView } from "./views/StaffView";
import { AttendanceView } from "./views/AttendanceView";
import { SalaryView } from "./views/SalaryView";
import { ReportsView } from "./views/ReportsView";
import { MarketingView } from "./views/MarketingView";
import { SettingsView } from "./views/SettingsView";

const VIEW_MAP: Record<ViewKey, React.ComponentType> = {
  dashboard: DashboardView,
  "daily-entries": DailyEntriesView,
  members: MembersView,
  plans: PlansView,
  appointments: AppointmentsView,
  services: ServicesView,
  payments: PaymentsView,
  packages: PackagesView,
  staff: StaffView,
  attendance: AttendanceView,
  salary: SalaryView,
  reports: ReportsView,
  marketing: MarketingView,
  settings: SettingsView,
};

export function ViewSwitcher() {
  const { view } = useSpa();
  const View = VIEW_MAP[view] ?? DashboardView;
  return <View />;
}
