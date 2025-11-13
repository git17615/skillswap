// seed.js - Database Seeder for SkillSwap
// Run this file to populate your database with demo data

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Connection
const MONGODB_URI = 'mongodb://localhost:27017/skillswap';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected for Seeding'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// User Schema (same as in server.js)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  offeredSkills: [{ type: String }],
  desiredSkills: [{ type: String }],
  isAdmin: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Demo Users Data
const demoUsers = [
  {
    name: 'Gitanjali A',
    email: 'gitanjali@pesu.ac.in',
    password: 'demo123',
    bio: 'Frontend enthusiast passionate about creating beautiful user interfaces. Looking to expand my skills into backend development.',
    offeredSkills: ['React.js', 'UI/UX Design', 'Frontend Development', 'Tailwind CSS', 'Figma'],
    desiredSkills: ['Node.js', 'MongoDB', 'Backend Development', 'REST APIs'],
    isAdmin: false,
    verified: true
  },
  {
    name: 'Harsimran Kaur',
    email: 'harsimran@pesu.ac.in',
    password: 'demo123',
    bio: 'Backend developer with experience in building scalable APIs. Eager to learn modern frontend frameworks.',
    offeredSkills: ['Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'JWT Authentication'],
    desiredSkills: ['React.js', 'UI/UX Design', 'Frontend Development'],
    isAdmin: false,
    verified: true
  },
  {
    name: 'Navya Suresh',
    email: 'navya@pesu.ac.in',
    password: 'demo123',
    bio: 'Data science student with strong Python skills. Exploring web development to build ML-powered applications.',
    offeredSkills: ['Python', 'Data Science', 'Machine Learning', 'Pandas', 'NumPy'],
    desiredSkills: ['Web Development', 'React.js', 'JavaScript', 'Full Stack Development'],
    isAdmin: true,
    verified: true
  },
  {
    name: 'Rahul Sharma',
    email: 'rahul@pesu.ac.in',
    password: 'demo123',
    bio: 'Mobile app developer interested in learning web technologies.',
    offeredSkills: ['Flutter', 'Dart', 'Mobile Development', 'Firebase'],
    desiredSkills: ['React.js', 'Next.js', 'Web Development'],
    isAdmin: false,
    verified: true
  },
  {
    name: 'Priya Patel',
    email: 'priya@pesu.ac.in',
    password: 'demo123',
    bio: 'DevOps enthusiast learning about cloud infrastructure and CI/CD.',
    offeredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    desiredSkills: ['Backend Development', 'Node.js', 'Microservices'],
    isAdmin: false,
    verified: false
  },
  {
    name: 'Arjun Kumar',
    email: 'arjun@pesu.ac.in',
    password: 'demo123',
    bio: 'Full stack developer with a passion for teaching and mentoring.',
    offeredSkills: ['JavaScript', 'TypeScript', 'React.js', 'Node.js', 'PostgreSQL'],
    desiredSkills: ['Go', 'Rust', 'System Programming'],
    isAdmin: false,
    verified: true
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@pesu.ac.in',
    password: 'demo123',
    bio: 'Cybersecurity student learning about secure coding practices.',
    offeredSkills: ['Cybersecurity', 'Ethical Hacking', 'Network Security'],
    desiredSkills: ['Web Development', 'Secure Coding', 'Backend Development'],
    isAdmin: false,
    verified: true
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@pesu.ac.in',
    password: 'demo123',
    bio: 'Blockchain enthusiast exploring decentralized applications.',
    offeredSkills: ['Blockchain', 'Solidity', 'Smart Contracts', 'Web3.js'],
    desiredSkills: ['React.js', 'Frontend Development', 'Full Stack Development'],
    isAdmin: false,
    verified: false
  }
];

// Seed Function
async function seedDatabase() {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});

    // Hash passwords and create users
    console.log('👥 Creating demo users...');
    const usersToCreate = await Promise.all(
      demoUsers.map(async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        return {
          ...userData,
          password: hashedPassword
        };
      })
    );

    await User.insertMany(usersToCreate);

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Created Users:');
    console.log('==================');
    
    demoUsers.forEach(user => {
      console.log(`\n👤 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Offers: ${user.offeredSkills.slice(0, 3).join(', ')}`);
      console.log(`   Wants: ${user.desiredSkills.slice(0, 3).join(', ')}`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Verified: ${user.verified ? 'Yes' : 'No'}`);
    });

    console.log('\n==================');
    console.log('🎉 You can now login with any of the above credentials!');
    console.log('💡 All passwords are: demo123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run seeder
seedDatabase();