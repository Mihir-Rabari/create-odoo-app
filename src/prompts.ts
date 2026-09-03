import * as p from '@clack/prompts';
import pc from 'picocolors';
import { validateProjectName } from './generator.js';

export interface PromptResult {
  projectName: string;
  theme: 'neutral' | 'zinc' | 'violet' | 'rose';
  features: string[];
  databasePort: number;
  redisPort: number;
  initGit: boolean;
  installDeps: boolean;
  startInfra: boolean;
}

export async function runInteractivePrompts(
  initialProjectName?: string,
  initialFlags?: {
    skipInstall?: boolean;
    skipGit?: boolean;
    withInfra?: boolean;
  }
): Promise<PromptResult | null> {
  console.log();
  p.intro(`${pc.bgCyan(pc.black(' create-odoo-app '))} ${pc.dim('Production-Ready Full-Stack Generator')}`);

  // 1. Project Name
  let projectName = initialProjectName;
  if (!projectName) {
    const nameInput = await p.text({
      message: 'What is your project name?',
      placeholder: 'my-odoo-app',
      defaultValue: 'my-odoo-app',
      validate: (value) => {
        if (!value) return 'Project name is required';
        const check = validateProjectName(value);
        if (!check.valid) return check.error || 'Invalid project name';
        return undefined;
      },
    });

    if (p.isCancel(nameInput)) {
      p.cancel('Operation cancelled.');
      return null;
    }
    projectName = nameInput;
  }

  // 2. UI Theme & Style Palette
  const themeSelect = await p.select({
    message: 'Select a UI Theme & Color Palette for Next.js (shadcn/ui):',
    initialValue: 'neutral',
    options: [
      { value: 'neutral', label: 'Neutral / Slate', hint: 'Modern dark & clean enterprise aesthetic' },
      { value: 'zinc', label: 'Zinc / Emerald', hint: 'High-contrast developer dashboard theme' },
      { value: 'violet', label: 'Violet / Indigo', hint: 'Sleek modern SaaS & application theme' },
      { value: 'rose', label: 'Rose / Crimson', hint: 'Bold energetic visual palette' },
    ],
  });

  if (p.isCancel(themeSelect)) {
    p.cancel('Operation cancelled.');
    return null;
  }

  // 3. Feature Selection
  const featuresSelect = await p.multiselect({
    message: 'Select framework modules & architectural features to include:',
    initialValues: ['iam', 'observability', 'storage'],
    options: [
      { value: 'iam', label: 'Identity & Access Management (IAM)', hint: 'RBAC, Policy Engine, Sessions, bcrypt/scrypt' },
      { value: 'observability', label: 'Observability & Metrics', hint: 'Prometheus /metrics, Grafana dashboards, Pino logger' },
      { value: 'storage', label: 'Object Storage (MinIO / S3)', hint: 'Presigned URLs, bucket management, StorageService' },
    ],
    required: false,
  });

  if (p.isCancel(featuresSelect)) {
    p.cancel('Operation cancelled.');
    return null;
  }

  // 4. Git Initialization
  let initGit = !(initialFlags?.skipGit);
  if (initialFlags?.skipGit === undefined) {
    const gitConfirm = await p.confirm({
      message: 'Initialize a new Git repository?',
      initialValue: true,
    });

    if (p.isCancel(gitConfirm)) {
      p.cancel('Operation cancelled.');
      return null;
    }
    initGit = gitConfirm;
  }

  // 5. Dependency Installation
  let installDeps = !(initialFlags?.skipInstall);
  if (initialFlags?.skipInstall === undefined) {
    const installConfirm = await p.confirm({
      message: 'Install workspace dependencies with pnpm now?',
      initialValue: true,
    });

    if (p.isCancel(installConfirm)) {
      p.cancel('Operation cancelled.');
      return null;
    }
    installDeps = installConfirm;
  }

  // 6. Start Docker Infrastructure
  let startInfra = Boolean(initialFlags?.withInfra);
  if (initialFlags?.withInfra === undefined && installDeps) {
    const infraConfirm = await p.confirm({
      message: 'Start local Docker infrastructure (PostgreSQL, Redis, MinIO) now?',
      initialValue: false,
    });

    if (p.isCancel(infraConfirm)) {
      p.cancel('Operation cancelled.');
      return null;
    }
    startInfra = infraConfirm;
  }

  return {
    projectName,
    theme: themeSelect as 'neutral' | 'zinc' | 'violet' | 'rose',
    features: featuresSelect as string[],
    databasePort: 5432,
    redisPort: 6379,
    initGit,
    installDeps,
    startInfra,
  };
}
