import { prisma } from '@/lib/prisma';
import { Prisma, BuildingCondition } from '@prisma/client';
import {
  ListLandsQuery,
  CreateLandInput,
  UpdateLandInput,
  ListBuildingsQuery,
  CreateBuildingInput,
  UpdateBuildingInput,
  CreateRoomTypeInput,
  UpdateRoomTypeInput,
  ListRoomsQuery,
  CreateRoomInput,
  UpdateRoomInput,
  SummaryQuery,
} from './facilities.schema';

// ==================== LAND SERVICE ====================

export async function listLands(query: ListLandsQuery) {
  const { page, limit, unitId, ownership, search } = query;

  const whereClause: Prisma.LandWhereInput = {};

  if (unitId) whereClause.unitId = unitId;
  if (ownership) whereClause.ownership = ownership;
  if (search) {
    whereClause.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [lands, total] = await Promise.all([
    prisma.land.findMany({
      where: whereClause,
      include: {
        unit: { select: { id: true, name: true } },
        _count: { select: { buildings: true } },
      },
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.land.count({ where: whereClause }),
  ]);

  return {
    data: lands,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getLandById(id: string) {
  return prisma.land.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      buildings: {
        select: {
          id: true,
          code: true,
          name: true,
          buildingArea: true,
          condition: true,
        },
      },
    },
  });
}

export async function createLand(data: CreateLandInput) {
  return prisma.land.create({
    data: {
      unitId: data.unitId,
      code: data.code,
      address: data.address,
      area: data.area,
      ownership: data.ownership,
      certificateNo: data.certificateNo,
      certificateDate: data.certificateDate,
      acquisitionDate: data.acquisitionDate,
      acquisitionValue: data.acquisitionValue,
      notes: data.notes,
    },
    include: {
      unit: { select: { name: true } },
    },
  });
}

export async function updateLand(id: string, data: UpdateLandInput) {
  return prisma.land.update({
    where: { id },
    data: {
      code: data.code,
      address: data.address,
      area: data.area,
      ownership: data.ownership,
      certificateNo: data.certificateNo,
      certificateDate: data.certificateDate,
      acquisitionDate: data.acquisitionDate,
      acquisitionValue: data.acquisitionValue,
      notes: data.notes,
    },
  });
}

export async function deleteLand(id: string) {
  // Check if land has buildings
  const buildingCount = await prisma.building.count({ where: { landId: id } });
  if (buildingCount > 0) {
    throw new Error(
      'Tidak dapat menghapus tanah yang memiliki bangunan. Hapus bangunan terlebih dahulu.'
    );
  }

  return prisma.land.delete({ where: { id } });
}

// ==================== BUILDING SERVICE ====================

export async function listBuildings(query: ListBuildingsQuery) {
  const { page, limit, unitId, landId, condition, search } = query;

  const whereClause: Prisma.BuildingWhereInput = {};

  if (unitId) whereClause.unitId = unitId;
  if (landId) whereClause.landId = landId;
  if (condition) whereClause.condition = condition;
  if (search) {
    whereClause.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [buildings, total] = await Promise.all([
    prisma.building.findMany({
      where: whereClause,
      include: {
        unit: { select: { id: true, name: true } },
        land: { select: { id: true, code: true, address: true } },
        _count: { select: { rooms: true } },
      },
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.building.count({ where: whereClause }),
  ]);

  return {
    data: buildings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBuildingById(id: string) {
  return prisma.building.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      land: { select: { id: true, code: true, address: true } },
      rooms: {
        select: {
          id: true,
          code: true,
          name: true,
          floor: true,
          area: true,
          capacity: true,
          condition: true,
          isActive: true,
          roomType: { select: { name: true } },
        },
      },
    },
  });
}

export async function createBuilding(data: CreateBuildingInput) {
  return prisma.building.create({
    data: {
      unitId: data.unitId,
      landId: data.landId,
      code: data.code,
      name: data.name,
      floors: data.floors,
      buildingArea: data.buildingArea,
      yearBuilt: data.yearBuilt,
      condition: data.condition,
      lastRenovation: data.lastRenovation,
      notes: data.notes,
    },
    include: {
      unit: { select: { name: true } },
      land: { select: { code: true } },
    },
  });
}

export async function updateBuilding(id: string, data: UpdateBuildingInput) {
  return prisma.building.update({
    where: { id },
    data: {
      landId: data.landId,
      code: data.code,
      name: data.name,
      floors: data.floors,
      buildingArea: data.buildingArea,
      yearBuilt: data.yearBuilt,
      condition: data.condition,
      lastRenovation: data.lastRenovation,
      notes: data.notes,
    },
  });
}

export async function deleteBuilding(id: string) {
  // Check if building has rooms
  const roomCount = await prisma.facilityRoom.count({ where: { buildingId: id } });
  if (roomCount > 0) {
    throw new Error(
      'Tidak dapat menghapus gedung yang memiliki ruangan. Hapus ruangan terlebih dahulu.'
    );
  }

  return prisma.building.delete({ where: { id } });
}

// ==================== ROOM TYPE SERVICE ====================

export async function listRoomTypes() {
  return prisma.roomType.findMany({
    include: {
      _count: { select: { rooms: true } },
    },
    orderBy: { code: 'asc' },
  });
}

export async function getRoomTypeById(id: string) {
  return prisma.roomType.findUnique({
    where: { id },
    include: {
      _count: { select: { rooms: true } },
    },
  });
}

export async function createRoomType(data: CreateRoomTypeInput) {
  return prisma.roomType.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
    },
  });
}

export async function updateRoomType(id: string, data: UpdateRoomTypeInput) {
  return prisma.roomType.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
    },
  });
}

export async function deleteRoomType(id: string) {
  // Check if room type is used
  const roomCount = await prisma.facilityRoom.count({ where: { roomTypeId: id } });
  if (roomCount > 0) {
    throw new Error('Tidak dapat menghapus tipe ruangan yang masih digunakan.');
  }

  return prisma.roomType.delete({ where: { id } });
}

// ==================== FACILITY ROOM SERVICE ====================

export async function listRooms(query: ListRoomsQuery) {
  const { page, limit, unitId, buildingId, roomTypeId, condition, isActive, search } = query;

  const whereClause: Prisma.FacilityRoomWhereInput = {};

  if (unitId) whereClause.unitId = unitId;
  if (buildingId) whereClause.buildingId = buildingId;
  if (roomTypeId) whereClause.roomTypeId = roomTypeId;
  if (condition) whereClause.condition = condition;
  if (isActive !== undefined) whereClause.isActive = isActive;
  if (search) {
    whereClause.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [rooms, total] = await Promise.all([
    prisma.facilityRoom.findMany({
      where: whereClause,
      include: {
        unit: { select: { id: true, name: true } },
        building: { select: { id: true, code: true, name: true } },
        roomType: { select: { id: true, code: true, name: true } },
      },
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.facilityRoom.count({ where: whereClause }),
  ]);

  return {
    data: rooms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRoomById(id: string) {
  return prisma.facilityRoom.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      building: { select: { id: true, code: true, name: true } },
      roomType: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function createRoom(data: CreateRoomInput) {
  return prisma.facilityRoom.create({
    data: {
      unitId: data.unitId,
      buildingId: data.buildingId,
      roomTypeId: data.roomTypeId,
      code: data.code,
      name: data.name,
      floor: data.floor,
      length: data.length,
      width: data.width,
      area: data.area,
      capacity: data.capacity,
      condition: data.condition,
      facilities: data.facilities ?? Prisma.JsonNull,
      isActive: data.isActive,
    },
    include: {
      unit: { select: { name: true } },
      building: { select: { name: true } },
      roomType: { select: { name: true } },
    },
  });
}

export async function updateRoom(id: string, data: UpdateRoomInput) {
  return prisma.facilityRoom.update({
    where: { id },
    data: {
      buildingId: data.buildingId,
      roomTypeId: data.roomTypeId,
      code: data.code,
      name: data.name,
      floor: data.floor,
      length: data.length,
      width: data.width,
      area: data.area,
      capacity: data.capacity,
      condition: data.condition,
      facilities: data.facilities === null ? Prisma.JsonNull : data.facilities,
      isActive: data.isActive,
    },
  });
}

export async function deleteRoom(id: string) {
  return prisma.facilityRoom.delete({ where: { id } });
}

// ==================== SUMMARY SERVICE ====================

export async function getFacilitiesSummary(query: SummaryQuery) {
  const { unitId } = query;

  const whereClause: Prisma.LandWhereInput = {};
  if (unitId) whereClause.unitId = unitId;

  const [lands, buildings, rooms, roomsByType, roomsByCondition] = await Promise.all([
    prisma.land.aggregate({
      where: whereClause,
      _count: true,
      _sum: { area: true },
    }),
    prisma.building.aggregate({
      where: whereClause as Prisma.BuildingWhereInput,
      _count: true,
      _sum: { buildingArea: true },
    }),
    prisma.facilityRoom.aggregate({
      where: whereClause as Prisma.FacilityRoomWhereInput,
      _count: true,
      _sum: { area: true, capacity: true },
    }),
    prisma.facilityRoom.groupBy({
      by: ['roomTypeId'],
      where: whereClause as Prisma.FacilityRoomWhereInput,
      _count: true,
    }),
    prisma.facilityRoom.groupBy({
      by: ['condition'],
      where: whereClause as Prisma.FacilityRoomWhereInput,
      _count: true,
    }),
  ]);

  // Get room type names
  const roomTypeIds = roomsByType.map((r) => r.roomTypeId);
  const roomTypes = await prisma.roomType.findMany({
    where: { id: { in: roomTypeIds } },
    select: { id: true, name: true },
  });
  const roomTypeMap = new Map(roomTypes.map((rt) => [rt.id, rt.name]));

  return {
    lands: {
      count: lands._count,
      totalArea: lands._sum.area || 0,
    },
    buildings: {
      count: buildings._count,
      totalArea: buildings._sum.buildingArea || 0,
    },
    rooms: {
      count: rooms._count,
      totalArea: rooms._sum.area || 0,
      totalCapacity: rooms._sum.capacity || 0,
    },
    roomsByType: roomsByType.map((r) => ({
      type: roomTypeMap.get(r.roomTypeId) || 'Unknown',
      count: r._count,
    })),
    roomsByCondition: roomsByCondition.map((r) => ({
      condition: r.condition,
      count: r._count,
    })),
  };
}
