import TrombinoscopeBasePage from "../../trombinoscope/TrombinoscopeBasePage";

// src/scenes/admin/persons/PersonAdminPage.tsx
export default function PersonAdminPage() {
  return <TrombinoscopeBasePage hideFollowFeatures={true} sessionKeyPrefix="admin_persons" />;
}
