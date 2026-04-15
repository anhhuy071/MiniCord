import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';

async function main() {
  console.log('🧹 Cleaning up existing data...');
  await prisma.directMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.serverMember.deleteMany();
  await prisma.server.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Seeding database...');

  // All seed accounts share the same password for easy local development
  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword   = await bcrypt.hash('admin1234!', 10);

  // ─────────────────────────────────────────────
  // 1. Users
  // ─────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@minicord.dev',
      password: adminPassword,
      avatarUrl: 'https://i.pravatar.cc/150?u=admin',
    }
  });

  const alice = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'alice@example.com',
      password: defaultPassword,
      avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    }
  });

  const bob = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'bob@example.com',
      password: defaultPassword,
      avatarUrl: 'https://i.pravatar.cc/150?u=bob',
    }
  });

  const charlie = await prisma.user.create({
    data: {
      username: 'charlie',
      email: 'charlie@example.com',
      password: defaultPassword,
      avatarUrl: 'https://i.pravatar.cc/150?u=charlie',
    }
  });

  console.log('✅ Created 4 users:');
  console.log('   👑 admin         — admin@minicord.dev    / admin1234!');
  console.log('   👤 alice         — alice@example.com     / password123');
  console.log('   👤 bob           — bob@example.com       / password123');
  console.log('   👤 charlie       — charlie@example.com   / password123');

  // ─────────────────────────────────────────────
  // 2. Servers & Channels
  // ─────────────────────────────────────────────

  // Admin owns the main hub server; alice is promoted to ADMIN role
  const mainServer = await prisma.server.create({
    data: {
      name: 'MiniCord HQ 🌍',
      ownerId: admin.id,
      imageUrl: 'https://i.pravatar.cc/150?img=11',
      channels: {
        create: [
          { name: 'general',      type: 'TEXT' },
          { name: 'announcements', type: 'TEXT' },
          { name: 'random',       type: 'TEXT' },
        ]
      },
      members: {
        create: [
          { userId: admin.id,    role: 'OWNER'  },
          { userId: alice.id,    role: 'ADMIN'  },
          { userId: bob.id,      role: 'MEMBER' },
          { userId: charlie.id,  role: 'MEMBER' },
        ]
      }
    },
    include: { channels: true }
  });
  console.log('✅ Created server "MiniCord HQ" with channels #general, #announcements, #random');

  const gamingServer = await prisma.server.create({
    data: {
      name: 'Gamer Lounge 🎮',
      ownerId: alice.id,
      imageUrl: 'https://i.pravatar.cc/150?img=12',
      channels: {
        create: [
          { name: 'lobby',    type: 'TEXT' },
          { name: 'valorant', type: 'TEXT' },
        ]
      },
      members: {
        create: [
          { userId: alice.id,   role: 'OWNER'  },
          { userId: bob.id,     role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
          { userId: admin.id,   role: 'ADMIN'  },
        ]
      }
    },
    include: { channels: true }
  });
  console.log('✅ Created server "Gamer Lounge" with channels #lobby, #valorant');

  // ─────────────────────────────────────────────
  // 3. Sample channel messages
  // ─────────────────────────────────────────────
  const generalChannel      = mainServer.channels.find(c => c.name === 'general')!;
  const announcementsChannel = mainServer.channels.find(c => c.name === 'announcements')!;

  await prisma.message.createMany({
    data: [
      { content: 'Welcome to MiniCord HQ! 🎉',              authorId: admin.id,   channelId: generalChannel.id },
      { content: 'Hey everyone, great to be here!',          authorId: alice.id,   channelId: generalChannel.id },
      { content: 'Looking forward to chatting with you all', authorId: bob.id,     channelId: generalChannel.id },
      { content: 'Hello MiniCord! 👋',                       authorId: charlie.id, channelId: generalChannel.id },
    ]
  });

  await prisma.message.createMany({
    data: [
      { content: '📢 Server rules: be kind, have fun, and keep it technical!', authorId: admin.id, channelId: announcementsChannel.id },
      { content: '🚀 MiniCord v1.0 is live. Real-time chat is up and running.', authorId: admin.id, channelId: announcementsChannel.id },
    ]
  });
  console.log('✅ Seeded sample channel messages');

  // ─────────────────────────────────────────────
  // 4. Direct message conversations
  // ─────────────────────────────────────────────
  await prisma.conversation.create({
    data: {
      userOneId: admin.id,
      userTwoId: alice.id,
      directMessages: {
        create: [
          { content: 'Hey Alice, just promoted you to Admin on the main server!', authorId: admin.id  },
          { content: 'Thanks admin! I will keep things in order 💪',              authorId: alice.id },
        ]
      }
    }
  });

  await prisma.conversation.create({
    data: {
      userOneId: alice.id,
      userTwoId: bob.id,
      directMessages: {
        create: [
          { content: 'Hey Bob, how is it going?',          authorId: alice.id },
          { content: 'Good, testing this DM feature out!', authorId: bob.id   },
          { content: 'DMs are working great 🎉',            authorId: alice.id },
        ]
      }
    }
  });

  await prisma.conversation.create({
    data: {
      userOneId: bob.id,
      userTwoId: charlie.id,
      directMessages: {
        create: [
          { content: 'Ranked Valorant tonight?',    authorId: bob.id     },
          { content: 'Absolutely, 8PM works for me', authorId: charlie.id },
        ]
      }
    }
  });

  console.log('✅ Seeded Direct Message conversations');
  console.log('');
  console.log('🎉 Database seeding complete!');
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('  Login credentials for testing:');
  console.log('  admin@minicord.dev  →  admin1234!');
  console.log('  alice@example.com   →  password123');
  console.log('  bob@example.com     →  password123');
  console.log('  charlie@example.com →  password123');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
