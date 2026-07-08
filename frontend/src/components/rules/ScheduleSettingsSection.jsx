import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import DayScheduleTimeline from "@/components/rules/DayScheduleTimeline";
import ScheduleBlockFields from "@/components/rules/ScheduleBlockFields";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSemester } from "@/contexts/SemesterContext";
import { getScheduleSettings, updateScheduleSettings } from "@/lib/api";
import { cloneDefaultBlocks } from "@/lib/scheduleDefaults";
import { validateScheduleBlocks } from "@/lib/scheduleTime";

function ScheduleSettingsSection() {
  const { logout } = useAuth();
  const { semester } = useSemester();
  const [blocks, setBlocks] = useState(cloneDefaultBlocks());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const loadSettings = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await getScheduleSettings({ semester }, handleUnauthorized);
      setBlocks(data.blocks.map((block) => ({ ...block })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar horarios");
      setBlocks(cloneDefaultBlocks());
    } finally {
      setIsLoading(false);
    }
  }, [semester, handleUnauthorized]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const validationError = validateScheduleBlocks(blocks);

  const handleSave = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      const data = await updateScheduleSettings({ blocks }, { semester }, handleUnauthorized);
      setBlocks(data.blocks.map((block) => ({ ...block })));
      setSuccessMessage("Horarios guardados correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar horarios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    const defaults = cloneDefaultBlocks();
    setBlocks(defaults);
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      const data = await updateScheduleSettings({ blocks: defaults }, { semester }, handleUnauthorized);
      setBlocks(data.blocks.map((block) => ({ ...block })));
      setSuccessMessage("Horarios restaurados a los valores EPIS.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restaurar horarios");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[548px] w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Horarios del día</h3>
          <p className="text-sm text-muted-foreground">
            Define desayuno, turnos y comidas de lunes a viernes. Los turnos lectivos
            determinan el rango horario de clases.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRestoreDefaults}
            disabled={isSaving}
          >
            <RotateCcw />
            Restaurar defaults
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || Boolean(validationError)}>
            <Save />
            Guardar
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {validationError && !error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {validationError}
        </p>
      )}
      {successMessage && (
        <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {successMessage}
        </p>
      )}

      <DayScheduleTimeline blocks={blocks} onChange={setBlocks} />

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Ajuste por bloque</h4>
        <ScheduleBlockFields blocks={blocks} onChange={setBlocks} disabled={isSaving} />
      </div>
    </section>
  );
}

export default ScheduleSettingsSection;
