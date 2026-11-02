import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    // sesion se resuelve en el beforeLoad del root; aquí solo se siembra la
    // forma del contexto para que las rutas la vean tipada.
    context: { queryClient, sesion: null },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
