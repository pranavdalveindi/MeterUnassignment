import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
})

export async function POST(request: NextRequest) {
  const { hhid, meterId } = await request.json()

  if (!hhid || !meterId) {
    return NextResponse.json(
      { success: false, error: 'Both HHID and Meter ID are required.' },
      { status: 400 }
    )
  }

  const client = await pool.connect()

  try {
    // Single atomic PL/pgSQL block:
    // - Resolves household and meter UUIDs (raises exception if not found)
    // - Captures assigned_at before deletion
    // - Deletes the meter_assignment record
    // - Unassigns the meter in the meters table
    // - Writes a history record to household_meter_history
    await client.query(
      `DO $$
      DECLARE
        v_meter_id VARCHAR := $1;
        v_hhid VARCHAR := $2;
        v_household_id UUID;
        v_meter_uuid UUID;
        v_assigned_at TIMESTAMPTZ;
      BEGIN
        SELECT id INTO v_household_id FROM households WHERE hhid = v_hhid;
        IF v_household_id IS NULL THEN RAISE EXCEPTION 'Household % not found', v_hhid; END IF;

        SELECT id INTO v_meter_uuid FROM meters WHERE meter_id = v_meter_id;
        IF v_meter_uuid IS NULL THEN RAISE EXCEPTION 'Meter % not found', v_meter_id; END IF;

        -- Capture assigned_at before deleting
        SELECT assigned_at INTO v_assigned_at
        FROM meter_assignments
        WHERE meter_id = v_meter_uuid AND household_id = v_household_id;

        -- Delete assignment
        DELETE FROM meter_assignments
        WHERE meter_id = v_meter_uuid AND household_id = v_household_id;

        -- Unassign meter
        UPDATE meters
        SET assigned_household_id = NULL, is_assigned = FALSE, updated_at = NOW()
        WHERE id = v_meter_uuid;

        -- Write history record
        INSERT INTO household_meter_history (household_id, meter_id, assigned_at, decommissioned_at)
        VALUES (v_household_id, v_meter_uuid, COALESCE(v_assigned_at, NOW()), NOW());

        RAISE NOTICE '✅ Meter % unassigned from % and history recorded', v_meter_id, v_hhid;
      END $$`,
      [meterId, hhid]
    )

    // Verify updated meter state after the block
    const verifyRes = await client.query(
      'SELECT meter_id, assigned_household_id, is_assigned, updated_at FROM meters WHERE meter_id = $1',
      [meterId]
    )

    const updatedMeter = verifyRes.rows[0]

    return NextResponse.json({
      success: true,
      message: `✅ Meter ${meterId} successfully unassigned from household ${hhid} and history recorded.`,
      meter: {
        meterId: updatedMeter.meter_id,
        assignedHouseholdId: updatedMeter.assigned_household_id,
        isAssigned: updatedMeter.is_assigned,
        updatedAt: updatedMeter.updated_at,
      },
    })
  } catch (err: unknown) {
    console.error('DB Error:', err)
    const message = err instanceof Error ? err.message : 'An unexpected database error occurred.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  } finally {
    client.release()
  }
}