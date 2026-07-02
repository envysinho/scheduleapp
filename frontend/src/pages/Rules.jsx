import PageCard from "@/components/PageCard";
import ScheduleSettingsSection from "@/components/rules/ScheduleSettingsSection";

function Rules() {
  return (
    <PageCard
      title="Reglas"
      description="Configuración de reglas académicas EPIS."
    >
      <ScheduleSettingsSection />
    </PageCard>
  );
}

export default Rules;
