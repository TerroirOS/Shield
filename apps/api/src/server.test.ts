import test from "node:test";
import assert from "node:assert/strict";
import { config } from "./config.js";

test("config defaults include dev auth mode", () => {
  assert.equal(config.AUTH_DEV_MODE, true);
  assert.equal(config.API_PORT > 0, true);
});
