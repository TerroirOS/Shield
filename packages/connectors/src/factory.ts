import type { RuntimeMode } from "@terroiros/domain";
import { MockCommitmentAdapter, MockNotificationAdapter, MockTraceConnector, MockTreasuryExportAdapter, MockWeatherConnector } from "./mock.js";

export function createConnectorSuite(runtimeMode: RuntimeMode) {
  // HYBRID and TESTNET currently reuse mocks with stable interfaces until live adapters are wired.
  return {
    runtimeMode,
    trace: new MockTraceConnector(),
    weather: new MockWeatherConnector(),
    commitment: new MockCommitmentAdapter(),
    treasury: new MockTreasuryExportAdapter(),
    notifications: new MockNotificationAdapter()
  };
}
