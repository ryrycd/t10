// LiveSync: one shared beat position across the deck, the script/remote page and mirrors.
// WebSocket to the Cloudflare Durable Object, plus a BroadcastChannel so windows in the
// same browser stay in step even with no network.
(function () {
  "use strict";

  function LiveSync(opts) {
    const role = opts.role || "mirror";
    const id = role + "-" + Math.random().toString(36).slice(2, 9);
    const room = window.ROOM || "main";
    const bc = "BroadcastChannel" in window ? new BroadcastChannel("scott-harris-intro-" + room) : null;
    let ws = null, retry = 0, pingTimer = null, closedByUs = false;
    let status = "connecting", presence = { deck: 0, script: 0, mirror: 0 };
    // moves made while offline are pushed on reconnect instead of being overwritten
    let pending = null, skipFirstState = false;

    function setStatus(s) { status = s; opts.onStatus && opts.onStatus(s, presence); }

    function connect() {
      // On GitHub Pages (static) the relay is the Cloudflare Worker; anywhere else it is the same host.
      const relay = location.hostname.endsWith("github.io") ? "scott-harris-intro.ryrycdryrycd.workers.dev" : location.host;
      const proto = relay !== location.host || location.protocol === "https:" ? "wss:" : "ws:";
      try { ws = new WebSocket(proto + "//" + relay + "/ws?role=" + role + "&room=" + room); }
      catch (e) { schedule(); return; }
      setStatus("connecting");
      ws.onopen = () => {
        retry = 0;
        if (pending !== null) {
          skipFirstState = true;
          ws.send(JSON.stringify({ type: "go", beat: pending, from: id }));
          pending = null;
        }
        setStatus("live");
        clearInterval(pingTimer);
        pingTimer = setInterval(() => { try { ws.send('{"type":"ping"}'); } catch (e) {} }, 20000);
      };
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.presence) { presence = m.presence; opts.onStatus && opts.onStatus(status, presence); }
        if (m.type === "state") {
          if (skipFirstState) { skipFirstState = false; return; }
          // our own echo: we already applied it locally
          if (m.from === id) return;
          opts.onState && opts.onState(m.beat, { remote: true, from: m.from });
        }
      };
      ws.onclose = () => { clearInterval(pingTimer); if (!closedByUs) { setStatus("offline"); schedule(); } };
      ws.onerror = () => { try { ws.close(); } catch (e) {} };
    }
    function schedule() {
      retry = Math.min(retry + 1, 6);
      setTimeout(connect, [0, 400, 800, 1500, 2500, 4000, 5000][retry]);
    }

    if (bc) bc.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.type === "go" && m.from !== id) opts.onState && opts.onState(m.beat, { remote: true, from: m.from, local: true });
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && (!ws || ws.readyState > 1)) { retry = 0; connect(); }
    });

    connect();

    return {
      id,
      get status() { return status; },
      get presence() { return presence; },
      go(beat) {
        if (opts.readOnly) return;
        const msg = { type: "go", beat, from: id };
        if (bc) bc.postMessage(msg);
        if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
        else pending = beat;
      },
      close() { closedByUs = true; try { ws.close(); } catch (e) {} },
    };
  }

  window.LiveSync = LiveSync;
})();
