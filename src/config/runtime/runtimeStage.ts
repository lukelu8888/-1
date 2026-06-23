function readBooleanEnv(value: unknown): boolean | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function resolveStage() {
  const explicitStage = String(import.meta.env.VITE_RUNTIME_STAGE || '').trim().toLowerCase();
  if (explicitStage === 'production') return 'production' as const;
  if (explicitStage === 'staging') return 'staging' as const;
  if (explicitStage === 'test' || explicitStage === 'testing') return 'testing' as const;
  return import.meta.env.PROD ? ('production' as const) : ('testing' as const);
}

export const runtimeStage = resolveStage();

export const runtimeStagePolicy = {
  stage: runtimeStage,
  isProductionLike: runtimeStage === 'production',
  isTestingLike: runtimeStage !== 'production',
  readBooleanEnv,
};

