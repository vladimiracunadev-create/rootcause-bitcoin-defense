function actorFrom(request) {
  const value = String(request.headers["x-rootcause-actor"] || "local-user");
  return /^[a-z0-9._@-]{1,80}$/i.test(value) ? value : "local-user";
}

export function jsonResponse(response, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    ...extraHeaders
  });
  response.end(payload);
}

export function createApiRouter({ service, readJson }) {
  return async function routeApi(request, response, url) {
    const method = request.method || "GET";
    const path = url.pathname;
    const actor = actorFrom(request);

    if (method === "GET" && path === "/api/health") {
      return jsonResponse(response, 200, {
        status: "ok",
        service: "rootcause-bitcoin-defense",
        version: "0.3.0",
        time: new Date().toISOString()
      });
    }

    if (method === "GET" && path === "/api/summary") {
      return jsonResponse(response, 200, await service.summary());
    }

    if (method === "GET" && path === "/api/wallets") {
      return jsonResponse(response, 200, { wallets: await service.wallets() });
    }

    if (method === "POST" && path === "/api/wallets") {
      const wallet = await service.addWallet(await readJson(request), actor);
      return jsonResponse(response, 201, { wallet });
    }

    if (method === "POST" && path === "/api/scan") {
      return jsonResponse(response, 200, await service.scan(actor));
    }

    if (method === "GET" && path === "/api/incidents") {
      return jsonResponse(response, 200, { incidents: await service.incidents() });
    }

    const incidentMatch = path.match(/^\/api\/incidents\/([a-f0-9]{20})$/);
    if (method === "PATCH" && incidentMatch) {
      const body = await readJson(request);
      const incident = await service.updateIncident(
        incidentMatch[1],
        body.status,
        actor
      );
      return jsonResponse(response, 200, { incident });
    }

    if (method === "GET" && path === "/api/advisories") {
      return jsonResponse(response, 200, {
        advisories: await service.advisoriesList()
      });
    }

    if (method === "GET" && path === "/api/policies") {
      return jsonResponse(response, 200, await service.policiesDocument());
    }

    // Postura de seguridad de la propia instalación: qué hallazgos produce la
    // aplicación al auditarse a sí misma, con la configuración viva.
    if (method === "GET" && path === "/api/posture") {
      return jsonResponse(response, 200, await service.posture());
    }

    if (method === "GET" && path === "/api/audit") {
      return jsonResponse(response, 200, await service.audit());
    }

    if (method === "POST" && path === "/api/approvals") {
      const approval = await service.approvePolicyHash(
        await readJson(request),
        actor
      );
      return jsonResponse(response, 201, { approval });
    }

    if (method === "POST" && path === "/api/observe/transaction") {
      const event = await service.observeTransaction(
        await readJson(request),
        actor
      );
      return jsonResponse(response, 201, { event });
    }

    if (method === "POST" && path === "/api/observe/privacy") {
      const event = await service.observePrivacyEvent(
        await readJson(request),
        actor
      );
      return jsonResponse(response, 201, { event });
    }

    if (method === "POST" && path === "/api/node/refresh") {
      return jsonResponse(response, 200, {
        node: await service.refreshNode(actor)
      });
    }

    return jsonResponse(response, 404, {
      error: {
        code: "NOT_FOUND",
        message: "API route not found."
      }
    });
  };
}
