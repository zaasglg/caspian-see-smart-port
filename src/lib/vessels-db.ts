import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbReady, getPool } from '@/lib/db';
import type { CargoType, Vessel } from '@/types/port';

interface VesselRow extends RowDataPacket {
  id: string;
  name: string;
  cargo_type: CargoType;
  draft: number | string;
  eta_min: number;
  cargo_tons: number;
  lat: number;
  lon: number;
  preferred_berth: string;
}

function mapVessel(row: VesselRow): Vessel {
  return {
    id: row.id,
    name: row.name,
    cargoType: row.cargo_type,
    draft: Number(row.draft),
    etaMin: Number(row.eta_min),
    cargoTons: Number(row.cargo_tons),
    lat: Number(row.lat),
    lon: Number(row.lon),
    preferredBerth: row.preferred_berth,
  };
}

export async function listVessels(userId: string): Promise<Vessel[]> {
  await dbReady();
  const [rows] = await getPool().query<VesselRow[]>(
    `SELECT id, name, cargo_type, draft, eta_min, cargo_tons, lat, lon, preferred_berth
     FROM vessels WHERE user_id = :userId ORDER BY created_at ASC`,
    { userId },
  );
  return rows.map(mapVessel);
}

export async function insertVessel(userId: string, vessel: Vessel) {
  await dbReady();
  await getPool().query(
    `INSERT INTO vessels
      (id, user_id, name, cargo_type, draft, eta_min, cargo_tons, lat, lon, preferred_berth)
     VALUES
      (:id, :userId, :name, :cargoType, :draft, :etaMin, :cargoTons, :lat, :lon, :preferredBerth)`,
    {
      id: vessel.id,
      userId,
      name: vessel.name,
      cargoType: vessel.cargoType,
      draft: vessel.draft,
      etaMin: vessel.etaMin,
      cargoTons: vessel.cargoTons,
      lat: vessel.lat,
      lon: vessel.lon,
      preferredBerth: vessel.preferredBerth,
    },
  );
}

export async function deleteVessel(userId: string, vesselId: string) {
  await dbReady();
  const [result] = await getPool().query<ResultSetHeader>(
    'DELETE FROM vessels WHERE id = :id AND user_id = :userId',
    { id: vesselId, userId },
  );
  return result.affectedRows > 0;
}

export async function clearVessels(userId: string) {
  await dbReady();
  await getPool().query('DELETE FROM vessels WHERE user_id = :userId', {
    userId,
  });
}

export async function replaceVessels(userId: string, vessels: Vessel[]) {
  await dbReady();
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM vessels WHERE user_id = :userId', { userId });
    for (const vessel of vessels) {
      await conn.query(
        `INSERT INTO vessels
          (id, user_id, name, cargo_type, draft, eta_min, cargo_tons, lat, lon, preferred_berth)
         VALUES
          (:id, :userId, :name, :cargoType, :draft, :etaMin, :cargoTons, :lat, :lon, :preferredBerth)`,
        {
          id: vessel.id,
          userId,
          name: vessel.name,
          cargoType: vessel.cargoType,
          draft: vessel.draft,
          etaMin: vessel.etaMin,
          cargoTons: vessel.cargoTons,
          lat: vessel.lat,
          lon: vessel.lon,
          preferredBerth: vessel.preferredBerth,
        },
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
