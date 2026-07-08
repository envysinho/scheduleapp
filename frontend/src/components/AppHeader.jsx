import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Moon, Settings, Sun } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { listNotifications } from "@/lib/api";

const SEMESTER_OPTIONS = ["Semestre 26-I", "Semestre 26-II"];

function getSeenStorageKey(user) {
  return `schedule.notifications.seen.${user?.id ?? user?.username ?? "current"}`;
}

function getClearedStorageKey(user) {
  return `schedule.notifications.cleared.${user?.id ?? user?.username ?? "current"}`;
}

function readSeenNotificationId(user) {
  const raw = localStorage.getItem(getSeenStorageKey(user));
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function readClearedNotificationId(user) {
  const raw = localStorage.getItem(getClearedStorageKey(user));
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatNotificationDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AppHeader({ isDark, onToggleTheme, onSearchSelect }) {
  const { logout, user } = useAuth();
  const [semester, setSemester] = useState(SEMESTER_OPTIONS[0]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [seenNotificationId, setSeenNotificationId] = useState(() =>
    readSeenNotificationId(user)
  );
  const [clearedNotificationId, setClearedNotificationId] = useState(() =>
    readClearedNotificationId(user)
  );
  const notificationPanelRef = useRef(null);
  const semesterAnchor = useComboboxAnchor();

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const loadNotifications = useCallback(async () => {
    setNotificationsError(null);
    setIsLoadingNotifications(true);
    try {
      const data = await listNotifications(handleUnauthorized);
      setNotifications(data);
    } catch (err) {
      setNotificationsError(
        err instanceof Error ? err.message : "Error al cargar notificaciones"
      );
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    setSeenNotificationId(readSeenNotificationId(user));
    setClearedNotificationId(readClearedNotificationId(user));
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (notificationPanelRef.current?.contains(event.target)) {
        return;
      }
      setIsNotificationsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isNotificationsOpen]);

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => notification.id > clearedNotificationId),
    [notifications, clearedNotificationId]
  );

  const unreadCount = useMemo(
    () => visibleNotifications.filter((notification) => notification.id > seenNotificationId).length,
    [visibleNotifications, seenNotificationId]
  );

  const markNotificationsAsSeen = useCallback(() => {
    const latestId = notifications.reduce(
      (max, notification) => Math.max(max, notification.id),
      seenNotificationId
    );
    if (latestId > seenNotificationId) {
      localStorage.setItem(getSeenStorageKey(user), String(latestId));
      setSeenNotificationId(latestId);
    }
  }, [notifications, seenNotificationId, user]);

  const clearRecentNotifications = () => {
    const latestId = notifications.reduce(
      (max, notification) => Math.max(max, notification.id),
      clearedNotificationId
    );
    localStorage.setItem(getClearedStorageKey(user), String(latestId));
    localStorage.setItem(getSeenStorageKey(user), String(latestId));
    setClearedNotificationId(latestId);
    setSeenNotificationId(latestId);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((current) => {
      if (!current) {
        markNotificationsAsSeen();
      }
      return !current;
    });
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <span className="font-semibold shrink-0">Gestor de Horarios</span>

      <div className="flex flex-1 items-center justify-center px-2 md:px-4">
        <GlobalSearch onSelect={onSearchSelect} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div ref={semesterAnchor} className="w-[170px]">
          <Combobox
            items={SEMESTER_OPTIONS}
            value={semester}
            onValueChange={setSemester}
          >
            <ComboboxInput
              id="header-semester"
              placeholder="Semestre"
              readOnly
              aria-label="Semestre"
            />
            <ComboboxContent anchor={semesterAnchor}>
              <ComboboxEmpty>Sin opciones.</ComboboxEmpty>
              <ComboboxList>
                {(label) => (
                  <ComboboxItem key={label} value={label}>
                    {label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <div ref={notificationPanelRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={toggleNotifications}
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
          >
            <Bell />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notificaciones</span>
          </Button>
          {isNotificationsOpen && (
            <div
              role="dialog"
              aria-label="Notificaciones"
              className="absolute right-0 top-10 z-50 w-[360px] overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
            >
              <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                <p className="text-sm font-medium">Notificaciones</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentNotifications}
                  disabled={visibleNotifications.length === 0}
                >
                  Borrar recientes
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {isLoadingNotifications && notifications.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    Cargando notificaciones...
                  </p>
                ) : notificationsError ? (
                  <p className="px-3 py-4 text-sm text-destructive">
                    {notificationsError}
                  </p>
                ) : visibleNotifications.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    Sin notificaciones.
                  </p>
                ) : (
                  visibleNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border-b px-3 py-2 last:border-b-0"
                    >
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{notification.actorName}</span>{" "}
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatNotificationDate(notification.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={isDark ? "Modo claro" : "Modo oscuro"}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
        <Button variant="ghost" size="icon">
          <Settings />
          <span className="sr-only">Configuración</span>
        </Button>
      </div>
    </header>
  );
}

export default AppHeader;
