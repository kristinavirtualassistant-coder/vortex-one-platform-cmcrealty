interface Env {
  ASSETS: Fetcher;
  BACKEND_ORIGIN: string;
}

function isBackendRoute(pathname: string): boolean {
  return pathname.startsWith('/api/') || pathname === '/api' || pathname.startsWith('/internal/');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (isBackendRoute(url.pathname)) {
      const backend = new URL(env.BACKEND_ORIGIN);
      backend.pathname = url.pathname;
      backend.search = url.search;

      const proxyRequest = new Request(backend.toString(), request);
      proxyRequest.headers.set('x-vortex-one-proxy', 'cloudflare-worker');

      return fetch(proxyRequest);
    }

    return env.ASSETS.fetch(request);
  },
};
