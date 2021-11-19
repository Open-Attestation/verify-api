import { readFileSync } from "fs";

try {
  const fixture = readFileSync("fixtures/pdt_pcr_notarized_with_nric_wrapped.json", "utf8");
  process.stdout.write(fixture);
} catch (err) {
  console.error(err);
}
