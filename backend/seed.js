require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB conectado');
    const existing = await User.findOne({ role: 'admin' });
    if (existing) { console.log('⚠️ Admin já existe:', existing.email); process.exit(0); }
    const admin = new User({
      email: process.env.ADMIN_EMAIL_MASTER || 'admin@maischat.com',
      password: process.env.ADMIN_PASSWORD_MASTER || 'MaisChat@2025!',
      role: 'admin', isActive: true, onboardingStep: 'active',
      responsavel: { nome: 'Administrador Mais Chat', email: process.env.ADMIN_EMAIL_MASTER || 'admin@maischat.com' }
    });
    await admin.save();
    console.log('\n🔐 Admin Master criado!');
    console.log(`   E-mail: ${admin.email}`);
    console.log(`   Senha:  ${process.env.ADMIN_PASSWORD_MASTER || 'MaisChat@2025!'}\n`);
    process.exit(0);
  } catch (e) { console.error('❌', e.message); process.exit(1); }
}
seed();
