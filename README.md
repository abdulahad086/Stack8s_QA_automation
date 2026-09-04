# Stack8s E2E Test Automation Framework

A clean, maintainable Playwright E2E automation framework for **Stack8s** built with TypeScript and Page Object Model (POM) pattern.

Target Environment: [https://develop-v2.stack8s.com/](https://develop-v2.stack8s.com/)

---

## 🏗 Framework Architecture

```text
Stack8s_automation/
├── .env                      # Environment variables (BASE_URL, STACK8S_USER, STACK8S_PASSWORD)
├── playwright.config.ts      # Playwright configuration (baseURL, workers: 1, custom reporter)
├── package.json              # NPM scripts for test execution
├── pages/                    # Page Object Model classes
│   ├── BasePage.ts           # Shared browser helpers & assertions
│   ├── LoginPage.ts          # Authentication POM
│   ├── ResourcesPage.ts      # Global & Stack-specific Resources POM
│   ├── ComputePage.ts        # Compute module POM
│   ├── StoragePage.ts        # Storage module POM (Volumes, Backups, Modal, Settings)
│   ├── AppsPage.ts           # Deploy Apps module POM (Inventory, Settings, Modal, Wizard)
│   ├── CustomWorkloadsPage.ts# Custom Workloads module POM (Inventory, Kinds, Wizard Tabs)
│   ├── TemplatesPage.ts      # Templates / Marketplace module POM (Catalog, Search, Category Pills, Install Modal)
│   ├── ContainerRegistryPage.ts # Container Registry POM (Images, Settings, Credentials, Docker Access)
│   ├── StacksPage.ts         # Stacks module POM (Stack Selector, Overview, Components, Connections, Settings)
│   ├── CostFiguresPage.ts    # Cost Figures POM (Balance, Burn, Timeframe Filters, Top Cost Nodes)
│   ├── MonitoringPage.ts     # Monitoring POM (Pods Running, Cluster CPU, Memory, Node/Stack Tabs, Timeframe Filters)
│   └── SettingsPage.ts       # Settings POM (Administration, Members, Add Member Modal, Personal Settings)
├── tests/                    # Test Spec files organized by feature
│   ├── auth/
│   │   └── login.spec.ts     # 8 Authentication tests (AUTH-001 to AUTH-008)
│   ├── resources/
│   │   ├── global_resources.spec.ts  # 5 Global Resources tests (OVR-RES-001 to OVR-RES-005)
│   │   └── stack_resources.spec.ts   # 3 Stack Navigation tests (STACK-RES-001 to STACK-RES-003)
│   ├── compute/
│   │   └── compute.spec.ts   # 7 Compute tests (CMP-001 to CMP-NAV-001)
│   ├── storage/
│   │   └── storage.spec.ts   # 9 Storage tests (STR-001 to STR-NAV-001)
│   ├── stacks/
│   │   └── stacks.spec.ts    # 8 Stacks tests (STK-001 to STK-NAV-001)
│   ├── apps/
│   │   └── apps.spec.ts      # 10 Deploy Apps tests (APP-001 to APP-NAV-001)
│   ├── custom_apps/
│   │   └── custom_workloads.spec.ts # 8 Custom Workloads tests (CST-001 to CST-NAV-001)
│   ├── templates/
│   │   └── templates.spec.ts # 8 Templates tests (TMP-001 to TMP-NAV-001)
│   ├── registry/
│   │   └── registry.spec.ts  # 7 Container Registry tests (REG-001 to REG-NAV-001)
│   ├── cost_figures/
│   │   └── cost_figures.spec.ts # 6 Cost Figures tests (CST-FIG-001 to CST-FIG-NAV-001)
│   ├── monitoring/
│   │   └── monitoring.spec.ts   # 7 Monitoring tests (MON-001 to MON-NAV-001)
│   └── settings/
│       └── settings.spec.ts     # 7 Settings tests (SET-001 to SET-NAV-001)
└── utils/
    └── summary-reporter.ts   # Custom summary reporter outputting clean test execution logs
```

---

## 🏷 Test Tags & Coverage

Tests are categorized using Playwright tags:
- **`@smoke`**: Critical path smoke tests (Login, Page load, Core navigation, Kubeconfig download, Connect Repo modal, Workload Wizard, Install Modal, Docker Access, Member Modal).
- **`@functional`**: Functional validations, error states, API vs UI metric mapping, form inputs, modal controls, wizard step navigation, dynamic search.
- **`@regression`**: Full regression test suite covering all features and sub-route navigation.

---

## git Execution Commands

```bash
# Run full E2E test suite sequentially across all modules (86 tests)
npm test

# Run tests by tag
npm run test:smoke
npm run test:functional
npm run test:regression

# Run specific feature suites
npm run test:auth
npm run test:apps
npm run test:custom-apps
npm run test:templates
npm run test:registry
npm run test:cost-figures
npm run test:monitoring
npm run test:settings
npx playwright test tests/resources/
npx playwright test tests/compute/
npx playwright test tests/storage/

# Run in headed mode with visual inspection (slowMo enabled)
npm run test:headed
```

---

## 📊 Summary of Automated Modules (86 / 86 Passed - 100%)

1. **Authentication (`tests/auth/login.spec.ts`)**: 8 tests covering UI elements, field editability, security password masking, empty form validation, invalid credentials error handling, malformed email validation, and forgot-password/sign-up navigation.
2. **Global & Stack Resources (`tests/resources/`)**: 8 tests covering total cluster metrics, Longhorn storage volumes, dynamic API vs UI matching, and 8 stack-specific sub-routes navigation (`cost-figures`, `advanced`, `database`, `data-analytics`, `storage`, `endpoints`, `custom-apps`, `llm-marketplace`).
3. **Compute (`tests/compute/compute.spec.ts`)**: 7 tests covering compute overview, active node pools, GPUs empty state, cluster network matrix, tab navigation, and Kubeconfig YAML file download.
4. **Storage (`tests/storage/storage.spec.ts`)**: 9 tests covering Volumes overview table, Backups S3 target configuration, recurring backup jobs, `"Add Schedule"` modal controls, Settings storage defaults, and tab switching.
5. **Stacks (`tests/stacks/stacks.spec.ts`)**: 8 tests covering Stack Selector dropdown, Overview tab capacity metrics & running workloads, Components tab installed components list, Connections tab endpoint connectivity matrix, Settings tab resource limits & Danger Zone, API vs UI stacks inventory validation, and full tab switching navigation.
6. **Deploy Apps (`tests/apps/apps.spec.ts`)**: 10 tests covering Application inventory table, dynamic API vs UI matching, Git Repository Settings navigation, "Connect Repository" modal flow, "New git app" deployment wizard, and full E2E application lifecycle.
7. **Custom Workloads (`tests/custom_apps/custom_workloads.spec.ts`)**: 8 tests covering Workload inventory, metric summary cards, API vs UI dynamic matching, Workload Kinds (`Deployment`, `StatefulSet`, `CronJob`), creation wizard step navigation, cancel actions, and readiness section validation.
8. **Templates (`tests/templates/templates.spec.ts`)**: 8 tests covering Marketplace & AI Models tabs, installed components API dynamic matching, search filter input, category pills (`Databases`, `AI & ML`, `Monitoring`, etc.), sub-tabs (`All Apps`, `Installed`), Target Environment install modal, and cancel dismiss flow.
9. **Container Registry (`tests/registry/registry.spec.ts`)**: 7 tests covering Images tab repositories and image tags, Settings tab Docker access & code snippets, Credentials tab connected external registries (`ghcr`, `gcr`, `ecr`, `dockerhub`), and tab navigation loop.
10. **Cost Figures (`tests/cost_figures/cost_figures.spec.ts`)**: 6 tests covering Balance, Combined Burn, Runway, MTD Spend, Month-End projection metrics, top cost resources API dynamic matching, timeframe filters (`7d`, `30d`, `90d`, `Custom`), and Top Cost-Driving Nodes table.
11. **Monitoring (`tests/monitoring/monitoring.spec.ts`)**: 7 tests covering Pods Running, Cluster CPU, Memory, 24h Restarts cards, cluster-overview API matching, historical node metrics API matching, project-stack pod distribution API matching, timeframe filters (`1h`, `6h`, `24h`, `7d`), and View tabs (`Node Resources`, `Stack Resources`, `GPU Metrics`).
12. **Settings (`tests/settings/settings.spec.ts`)**: 7 tests covering Administration header, Team Members table, `/users?` API dynamic matching, "Add Member" invite modal flow, email input validation & cancel dismiss, member search filtering, sub-tabs (`Members`, `Billing`, `Audit`), and Personal Settings scope (`Profile`, `Appearance`, `Credentials`).


---

## 🚀 Performance & Load Testing Framework (k6)

The project includes an **automated API Load & Performance Testing Suite** powered by **k6**. It tests application response times, error rates, and throughput under concurrent Virtual Users (VUs) before release.

### ⚡ Quick Start (1 Command)

Run full performance testing and auto-generate reports:

```bash
npm run test:performance
```

Or run directly using the bash script:

```bash
./performance/run.sh
```

### 📋 Available Commands

| Command | Purpose | Profile |
|---------|---------|---------|
| `npm run test:performance` | Full benchmark run + HTML report | 5-10 VUs (1 minute) |
| `npm run test:performance:smoke` | Fast smoke verification | 1 VU (10 seconds) |
| `npm run test:performance:load` | Sustained load test | 10 VUs (1 minute) |

### 📊 Performance Reports & SLAs

After execution, interactive reports are saved to `performance/reports/`:
- **HTML Visual Dashboard**: `performance/reports/performance_report.html`
- **JSON Raw Metrics**: `performance/reports/summary.json`

**Default SLA Targets:**
- ⏱️ **p(95) Response Time**: `< 1500 ms`
- ❌ **HTTP Error Rate**: `< 10%`
- ✅ **Checks Pass Rate**: `> 85%`

### 📧 Automated QA Defect Email Alerts (`utils/email-reporter.ts`)

The framework includes an **Automated Email Defect Alert System**. Whenever any test fails during execution, an HTML email report is formatted and dispatched to the Team Lead & QA team containing:
- 🚨 **Defect Summary & Module Name**
- ❌ **Exact Error Traceback & Stack Lines**
- 📊 **Execution Metrics** (Total, Passed, Failed, Pass Rate %)
- ⏱️ **Execution Duration**

**To enable email alerts**, add your SMTP credentials to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_TO=team-lead@stack8s.com,qa@stack8s.com
EMAIL_ALWAYS=false
```
