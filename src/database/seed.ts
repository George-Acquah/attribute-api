import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ======================
  // Seed Roles
  // ======================
  const roles = ['admin', 'manager', 'user'];
  const roleRecords: Record<string, any> = {};

  for (const role of roles) {
    const record = await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
    roleRecords[role] = record;
  }

  console.log('Seeded roles:', roles);

  // ======================
  // Seed Role Permissions
  // ======================
  // Seed role permissions
  const rolePermissions: {
    role: string;
    action: string;
    subject: string;
    conditions?: Record<string, any>;
  }[] = [
    { role: 'admin', action: 'manage', subject: 'all' },

    { role: 'manager', action: 'read', subject: 'all' },
    { role: 'manager', action: 'create', subject: 'Campaign' },
    // Manager can update/delete only campaigns they own
    {
      role: 'manager',
      action: 'update',
      subject: 'Campaign',
      conditions: { ownerId: '${user.id}' }, // placeholder, CASL will replace
    },
    {
      role: 'manager',
      action: 'delete',
      subject: 'Campaign',
      conditions: { ownerId: '${user.id}' },
    },

    { role: 'user', action: 'read', subject: 'Campaign' },
    { role: 'user', action: 'read', subject: 'Code' },
    {
      role: 'user',
      action: 'read',
      subject: 'User',
      conditions: { id: '${user.id}' },
    },
    {
      role: 'user',
      action: 'update',
      subject: 'Campaign',
      conditions: { id: '${user.id}' },
    },
    {
      role: 'user',
      action: 'delete',
      subject: 'Campaign',
      conditions: { id: '${user.id}' },
    },
  ];

  for (const perm of rolePermissions) {
    const role = await prisma.role.findUnique({
      where: { name: perm.role },
    });

    if (!role) continue;

    await prisma.rolePermission.upsert({
      where: {
        roleId_action_subject: {
          roleId: role.id,
          action: perm.action,
          subject: perm.subject,
        },
      },
      update: {
        conditions: perm.conditions
          ? JSON.stringify(perm.conditions)
          : undefined,
      },
      create: {
        roleId: role.id,
        action: perm.action,
        subject: perm.subject,
        conditions: perm.conditions
          ? JSON.stringify(perm.conditions)
          : undefined,
      },
    });
  }

  console.log('Seeded role permissions');

  // ======================
  // Seed Channels
  // ======================
  const channels = await Promise.all([
    prisma.channel.upsert({
      where: { name: 'TV' },
      update: {},
      create: { name: 'TV' },
    }),
    prisma.channel.upsert({
      where: { name: 'Radio' },
      update: {},
      create: { name: 'Radio' },
    }),
    prisma.channel.upsert({
      where: { name: 'Digital' },
      update: {},
      create: { name: 'Digital' },
    }),
    prisma.channel.upsert({
      where: { name: 'Print' },
      update: {},
      create: { name: 'Print' },
    }),
    prisma.channel.upsert({
      where: { name: 'Outdoor' },
      update: {},
      create: { name: 'Outdoor' },
    }),
  ]);

  console.log(
    'Seeded channels:',
    channels.map((c) => c.name),
  );

  // ======================
  // Seed Countries & Regions
  // ======================
  const ghana = await prisma.country.upsert({
    where: { name: 'Ghana' },
    update: {},
    create: { name: 'Ghana', code: 'GH' },
  });
  const nigeria = await prisma.country.upsert({
    where: { name: 'Nigeria' },
    update: {},
    create: { name: 'Nigeria', code: 'NG' },
  });

  const ghanaRegions = [
    'Ahafo',
    'Ashanti',
    'Bono',
    'Bono East',
    'Central',
    'Eastern',
    'Greater Accra',
    'North East',
    'Northern',
    'Oti',
    'Savannah',
    'Upper East',
    'Upper West',
    'Volta',
    'Western',
    'Western North',
  ];

  await Promise.all(
    ghanaRegions.map((region) =>
      prisma.region.upsert({
        where: { name_countryId: { name: region, countryId: ghana.id } },
        update: {},
        create: { name: region, countryId: ghana.id },
      }),
    ),
  );

  const nigeriaStates = [
    'Abia',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara',
    'FCT Abuja',
  ];

  await Promise.all(
    nigeriaStates.map((state) =>
      prisma.region.upsert({
        where: { name_countryId: { name: state, countryId: nigeria.id } },
        update: {},
        create: { name: state, countryId: nigeria.id },
      }),
    ),
  );

  console.log(
    `Seeded: ${ghanaRegions.length} Ghana regions, ${nigeriaStates.length} Nigeria states`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
