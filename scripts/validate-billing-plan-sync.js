const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const planConfig = JSON.parse(fs.readFileSync(path.join(root, "config", "billing-plans.json"), "utf8"));

const backendBilling = fs.readFileSync(path.join(root, "backend", "src", "lib", "billing.ts"), "utf8");
const frontendPayment = fs.readFileSync(path.join(root, "frontend", "src", "app", "pages", "payment.tsx"), "utf8");
const frontendPricing = fs.readFileSync(path.join(root, "frontend", "src", "app", "pages", "pricing.tsx"), "utf8");

const failures = [];

function expectIncludes(fileLabel, content, expected, description) {
  if (!content.includes(expected)) {
    failures.push(`${fileLabel}: missing ${description}: ${expected}`);
  }
}

for (const plan of planConfig.plans.filter((item) => item.monthlyCredits !== null)) {
  expectIncludes("frontend/src/app/pages/pricing.tsx", frontendPricing, `id: "${plan.id}"`, `${plan.id} pricing plan`);
  expectIncludes("frontend/src/app/pages/pricing.tsx", frontendPricing, `monthlyPrice: ${plan.monthlyPrice}`, `${plan.id} pricing price`);
  expectIncludes("frontend/src/app/pages/pricing.tsx", frontendPricing, `credits: ${plan.monthlyCredits}`, `${plan.id} pricing credits`);
}

for (const plan of planConfig.plans.filter((item) => item.selfServe && item.monthlyPrice > 0)) {
  const backendAllowancePattern = new RegExp(`['"]?${plan.id.replace("+", "\\+")}['"]?\\s*:\\s*${plan.monthlyCredits}`);
  if (!backendAllowancePattern.test(backendBilling)) {
    failures.push(`backend/src/lib/billing.ts: missing ${plan.id} allowance: ${plan.monthlyCredits}`);
  }
  expectIncludes("frontend/src/app/pages/payment.tsx", frontendPayment, `id: "${plan.id}"`, `${plan.id} payment plan`);
  expectIncludes("frontend/src/app/pages/payment.tsx", frontendPayment, `monthlyPrice: ${plan.monthlyPrice}`, `${plan.id} monthly price`);
  expectIncludes("frontend/src/app/pages/payment.tsx", frontendPayment, `annualPrice: ${plan.annualPrice}`, `${plan.id} annual price`);
  expectIncludes("frontend/src/app/pages/payment.tsx", frontendPayment, `credits: ${plan.monthlyCredits}`, `${plan.id} payment credits`);
}

for (const topUp of planConfig.topUps) {
  expectIncludes("backend/src/lib/credits.ts or billing.ts", fs.readFileSync(path.join(root, "backend", "src", "lib", "credits.ts"), "utf8"), `key: '${topUp.id}'`, `${topUp.id} credit pack`);
  expectIncludes("backend/src/lib/billing.ts", backendBilling, `credits: ${topUp.credits}`, `${topUp.id} top-up credits`);
  expectIncludes("backend/src/lib/billing.ts", backendBilling, topUp.productEnv, `${topUp.id} product env`);
  expectIncludes("backend/src/lib/billing.ts", backendBilling, topUp.priceEnv, `${topUp.id} price env`);
}

if (failures.length > 0) {
  console.error("Billing plan sync check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Billing plan sync check passed.");
