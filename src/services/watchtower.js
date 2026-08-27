// Vigilancia periodica: consultar el nodo y reevaluar, sin solaparse.
//
// Apagada por defecto. Hacer polling contra el nodo de alguien sin que lo haya
// pedido es tomar una decision que no corresponde al programa, y ademas
// `check-security-claims.js` verifica en cada build que sigue desactivada de
// fabrica.
//
// La bandera `running` evita que un tick tarde mas que el intervalo y se apilen
// consultas sobre un nodo que ya va lento. Y `timer.unref()` hace que este
// temporizador no mantenga vivo el proceso: al cerrar la aplicacion, se cierra.
//
// Un error dentro del tick se registra y se traga: la vigilancia es un servicio
// de fondo, y que el nodo no responda un minuto no puede tumbar el panel.
export class Watchtower {
  constructor(service, options) {
    this.service = service;
    this.options = options;
    this.timer = null;
    this.running = false;
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.service.refreshNode("watchtower");
      await this.service.scan("watchtower");
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "watchtower_tick_failed",
          message: error.message,
          occurredAt: new Date().toISOString()
        })
      );
    } finally {
      this.running = false;
    }
  }

  start() {
    if (!this.options.enabled || this.timer) return;
    this.timer = setInterval(() => this.tick(), this.options.intervalMs);
    this.timer.unref();
    this.tick();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
