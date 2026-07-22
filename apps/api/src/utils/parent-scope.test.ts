import { describe, it, expect } from 'vitest';
import { RoleCode, UnitType } from '@prisma/client';
import { requiredParentRoles } from './parent-scope';

/**
 * The rule these pin: a wali holds one guardian role per unit in which they
 * have a child. Before it existed, the unit was written once by hand when the
 * first child was recorded, so a second child at another jenjang changed
 * nothing and the parent could not reach that school at all.
 */
describe('requiredParentRoles', () => {
  it('gives one role for a single child', () => {
    expect(
      requiredParentRoles([{ unitId: 'u-sd', unitType: UnitType.SD_IT }])
    ).toEqual([{ unitId: 'u-sd', roleCode: RoleCode.SDIT_ORANG_TUA }]);
  });

  it('spans every unit the children study in', () => {
    const roles = requiredParentRoles([
      { unitId: 'u-tk', unitType: UnitType.TK_QURAN },
      { unitId: 'u-sd', unitType: UnitType.SD_IT },
      { unitId: 'u-smp', unitType: UnitType.SMP_IT },
    ]);

    expect(roles).toHaveLength(3);
    expect(roles.map((r) => r.roleCode).sort()).toEqual(
      [
        RoleCode.SDIT_ORANG_TUA,
        RoleCode.SMPIT_ORANG_TUA,
        RoleCode.TKQ_ORANG_TUA,
      ].sort()
    );
  });

  it('collapses siblings in the same unit to one role', () => {
    expect(
      requiredParentRoles([
        { unitId: 'u-smp', unitType: UnitType.SMP_IT },
        { unitId: 'u-smp', unitType: UnitType.SMP_IT },
      ])
    ).toHaveLength(1);
  });

  // A mahasiswa is an adult; the RoleCode enum has no guardian role for PT and
  // inventing one would model something the institution does not do.
  it('skips Perguruan Tinggi', () => {
    expect(
      requiredParentRoles([
        { unitId: 'u-pt', unitType: UnitType.PERGURUAN_TINGGI },
      ])
    ).toEqual([]);
  });

  it('keeps the school roles when a child is at PT and another at school', () => {
    const roles = requiredParentRoles([
      { unitId: 'u-pt', unitType: UnitType.PERGURUAN_TINGGI },
      { unitId: 'u-sma', unitType: UnitType.SMA_QURAN },
    ]);

    expect(roles).toEqual([
      { unitId: 'u-sma', roleCode: RoleCode.SMAQ_ORANG_TUA },
    ]);
  });

  it('returns nothing for a guardian with no children', () => {
    expect(requiredParentRoles([])).toEqual([]);
  });
});
