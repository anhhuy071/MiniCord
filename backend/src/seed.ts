import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS = [
  { username: 'alex_gamer', email: 'alex@example.com', name: 'Alex' },
  { username: 'jordan.dev', email: 'jordan@example.com', name: 'Jordan' },
  { username: 'taylor_swift', email: 'taylor@example.com', name: 'Taylor' },
  { username: 'casey_codes', email: 'casey@example.com', name: 'Casey' },
  { username: 'morgan_designs', email: 'morgan@example.com', name: 'Morgan' },
  { username: 'jamie_plays', email: 'jamie@example.com', name: 'Jamie' },
  { username: 'riley_studying', email: 'riley@example.com', name: 'Riley' },
  { username: 'avery_music', email: 'avery@example.com', name: 'Avery' },
  { username: 'sam_hacker', email: 'sam@example.com', name: 'Sam' },
  { username: 'quinn_art', email: 'quinn@example.com', name: 'Quinn' },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 0. Clean existing data (Optional, but good for reliable seed)
    console.log('🧹 Clearing existing data...');
    await prisma.directMessage.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.channel.deleteMany({});
    await prisma.serverMember.deleteMany({});
    await prisma.server.deleteMany({});
    await prisma.user.deleteMany({});

    // 1. Create Users
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const createdUsers = [];
    for (let i = 0; i < USERS.length; i++) {
      const user = await prisma.user.create({
        data: {
          username: USERS[i].username,
          email: USERS[i].email,
          password: hashedPassword,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${USERS[i].username}`,
        },
      });
      createdUsers.push(user);
    }

    // 2. Create Servers
    console.log('🏰 Creating servers...');
    const serversData = [
      { name: 'Gaming Lounge', owner: createdUsers[0], img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop' },
      { name: 'Study Group', owner: createdUsers[2], img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=200&auto=format&fit=crop' },
      { name: 'Dev Team', owner: createdUsers[4], img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop' },
    ];

    const createdServers = [];
    for (const sData of serversData) {
      const server = await prisma.server.create({
        data: {
          name: sData.name,
          ownerId: sData.owner.id,
          imageUrl: sData.img,
        }
      });
      createdServers.push(server);

      // Add owner as a member (often handled by server creation logic, but doing it explicitly here)
      await prisma.serverMember.create({
        data: {
          userId: sData.owner.id,
          serverId: server.id,
          role: 'ADMIN'
        }
      });
      
      // Randomly add other users as members
      const numMembers = Math.floor(Math.random() * 4) + 3; // 3 to 6 members
      for (let i = 0; i < numMembers; i++) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        if (randomUser.id !== sData.owner.id) {
          // ensure no duplicate member silently
          const existing = await prisma.serverMember.findFirst({
            where: { userId: randomUser.id, serverId: server.id }
          });
          if (!existing) {
            await prisma.serverMember.create({
              data: {
                userId: randomUser.id,
                serverId: server.id,
                role: 'MEMBER'
              }
            });
          }
        }
      }
    }

    // 3. Create Channels
    console.log('📺 Creating channels...');
    for (const server of createdServers) {
      const channelNames = server.name === 'Gaming Lounge' ? ['general', 'lfg-valorant', 'memes'] 
                        : server.name === 'Study Group' ? ['general', 'resources', 'math-help']
                        : ['general', 'frontend', 'backend'];
                        
      for (const cName of channelNames) {
        await prisma.channel.create({
          data: {
            name: cName,
            type: cName.includes('voice') ? 'VOICE' : 'TEXT',
            serverId: server.id
          }
        });
      }
    }

    // 4. Create Messages
    console.log('💬 Seeding some chat messages...');
    const allChannels = await prisma.channel.findMany({ include: { server: { include: { members: true } } } });

    const genericMessages = [
      "Hello everyone!",
      "Anyone want to chat?",
      "I'm working on a cool project.",
      "Just finished reading a nice book.",
      "How is everyone doing today?",
      "Does anyone have the link?",
      "I agree with that completely.",
      "Let's play some games tonight!",
      "I need help with this math problem.",
      "Vue vs React, what do you think?"
    ];

    for (const channel of allChannels) {
      const members = channel.server.members;
      if (members.length === 0) continue;

      const numMessages = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < numMessages; i++) {
        const randomMember = members[Math.floor(Math.random() * members.length)];
        const content = genericMessages[Math.floor(Math.random() * genericMessages.length)];
        
        await prisma.message.create({
          data: {
            content,
            authorId: randomMember.userId,
            channelId: channel.id,
          }
        });
      }
    }

    // 5. Create DMs
    console.log('📬 Creating Direct Messages...');
    const conv1 = await prisma.conversation.create({
      data: {
        userOneId: createdUsers[0].id,
        userTwoId: createdUsers[1].id,
      }
    });

    await prisma.directMessage.createMany({
      data: [
        { content: "Hey Jordan, are you around?", authorId: createdUsers[0].id, conversationId: conv1.id },
        { content: "Yeah, what's up?", authorId: createdUsers[1].id, conversationId: conv1.id },
        { content: "Just wanted to see if you wanted to test this MiniCord app.", authorId: createdUsers[0].id, conversationId: conv1.id },
      ]
    });

    console.log('✅ Seeding completed successfully!');
    console.log('Use email: alex@example.com / Password: password123 to login.');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
