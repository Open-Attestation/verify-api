import { readFileSync } from "fs";
import { getLogger } from "@libs/logger";

const { error } = getLogger("src/functions/verify/mock.ts");

try {
  const fixture = readFileSync("fixtures/pdt_pcr_notarized_with_nric_wrapped.json", "utf8");
  process.stdout.write(fixture);
} catch (err) {
  error(err);
}
