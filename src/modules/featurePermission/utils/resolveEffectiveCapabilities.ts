import { CapabilityOverrideData } from '@models/CapabilityOverride.js';

export function resolveEffectiveCapabilities(planCaps: any, overrides: CapabilityOverrideData[]) {
  const effective = structuredClone(planCaps);

  for (const o of overrides) {
    const feature = o.feature as keyof typeof effective;
    const key = o.capabilityKey;

    if (!effective[feature]) continue;

    const baseValue = effective[feature][key];
 
    if (typeof baseValue === 'number' && typeof o.value === 'number') {
      effective[feature][key] = Math.max(baseValue, o.value);
    }
 
    if (typeof baseValue === 'boolean' && typeof o.value === 'boolean') {
      effective[feature][key] = baseValue || o.value;
    }
  }

  return effective;
}
