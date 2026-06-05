import "@/i18n";
import { AppToaster } from "@/components/AppToaster";
import { sweepExpiredMealPhotosFromCache } from "@/lib/meal-photo-cache-db";
import { clearStaleWorkboxCaches, isInstalledPwa } from "@/lib/pwa";
import { router } from "@/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Keep the in-app wordmark splash visible at least this long (iOS native splash is not controllable). */
const LAUNCH_SPLASH_MIN_MS = 850;
const launchStartedAt = performance.now();

/** Drop stale workbox SWs left on :5173 from past builds (no reload — that caused dev loops). */
async function unregisterServiceWorkersInDev(): Promise<void> {
  if (!import.meta.env.DEV || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  if (regs.length === 0) return;
  await Promise.all(regs.map((r) => r.unregister()));
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function dismissLaunchSplash() {
  document.body.classList.add("app-ready");
  await waitForNextFrame();
  await waitForNextFrame();

  const remaining =
    LAUNCH_SPLASH_MIN_MS - (performance.now() - launchStartedAt);
  if (remaining > 0) {
    await waitMs(remaining);
  }

  document.getElementById("pwa-launch")?.remove();
}

void (async () => {
  if (import.meta.env.DEV) {
    await unregisterServiceWorkersInDev();
  } else {
    await clearStaleWorkboxCaches();
  }

  void sweepExpiredMealPhotosFromCache();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <AppToaster />
      </QueryClientProvider>
    </StrictMode>,
  );

  if (isInstalledPwa()) {
    await dismissLaunchSplash();
  } else {
    document.getElementById("pwa-launch")?.remove();
    document.body.classList.add("app-ready");
  }
})();
