import { apiRequest, type AuthSession } from "./auth-api";

/**
 * Lookups against the real seeded database, used by specs that need an
 * existing record's id (instead of stubbing the API with a fake one).
 */

export interface SeededPlan {
  id: string;
  title: string;
  unitId: string;
}

/**
 * Find a seeded strategic plan. The perencanaan list endpoint is scoped per
 * unit (even for privileged users), so walk the units until one has a plan.
 */
export async function findStrategicPlan(session: AuthSession): Promise<SeededPlan> {
  const units = await apiRequest<{ data: Array<{ id: string; name: string }> }>(
    session,
    "GET",
    "/units",
  );
  for (const unit of units.data ?? []) {
    const plans = await apiRequest<{ data: SeededPlan[] }>(
      session,
      "GET",
      `/perencanaan?unitId=${unit.id}`,
    );
    if (plans.data?.length) return plans.data[0];
  }
  throw new Error("No strategic plan found in any unit — is the database seeded?");
}
