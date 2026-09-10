export class DeskSealedError extends Error {
  readonly status = 503;
  constructor(message = "Desk sealed — database unavailable") {
    super(message);
    this.name = "DeskSealedError";
  }
}

export class GateClosedError extends Error {
  readonly status = 403;
  constructor(message = "Gate closed") {
    super(message);
    this.name = "GateClosedError";
  }
}

export class HitlRequiredError extends Error {
  readonly status = 402;
  constructor(message = "Human approval required") {
    super(message);
    this.name = "HitlRequiredError";
  }
}
