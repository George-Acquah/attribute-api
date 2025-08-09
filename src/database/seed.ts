import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = ['admin', 'manager', 'user'];
  console.log(roles);

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  // Seed Channels
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

  // Seed Countries
  const countries = await Promise.all([
    prisma.country.upsert({
      where: { name: 'Ghana' },
      update: {},
      create: {
        name: 'Ghana',
        code: 'GH',
      },
    }),
    prisma.country.upsert({
      where: { name: 'Nigeria' },
      update: {},
      create: {
        name: 'Nigeria',
        code: 'NG',
      },
    }),
  ]);

  console.log(
    'Seeded countries:',
    countries.map((c) => c.name),
  );

  // Seed Ghana Regions (16)
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
        where: {
          name_countryId: {
            name: region,
            countryId: countries[0].id, // Ghana
          },
        },
        update: {},
        create: {
          name: region,
          countryId: countries[0].id,
        },
      }),
    ),
  );

  // Seed Nigeria States (36 + FCT)
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
        where: {
          name_countryId: {
            name: state,
            countryId: countries[1].id, // Nigeria
          },
        },
        update: {},
        create: {
          name: state,
          countryId: countries[1].id,
        },
      }),
    ),
  );

  console.log('Seeded:');
  console.log(`- ${ghanaRegions.length} Ghana regions`);
  console.log(`- ${nigeriaStates.length} Nigeria states`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
