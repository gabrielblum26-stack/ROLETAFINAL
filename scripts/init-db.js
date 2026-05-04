const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL não configurado');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Criar tabela users
    console.log('📋 Criando tabela users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin','user')),
        status TEXT NOT NULL CHECK (status IN ('active','blocked')) DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_login_at TIMESTAMPTZ
      );
    `);

    // Adicionar colunas se não existirem
    console.log('📝 Adicionando colunas adicionais...');
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS access_until TIMESTAMPTZ`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS access_type TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_id TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_issued_at TIMESTAMPTZ`);

    // Limpar todos os usuários
    console.log('🗑️  Limpando todos os usuários existentes...');
    await client.query('DELETE FROM users');

    // Criar admin único
    const adminUsername = process.env.ADMIN_USERNAME || 'cleber';
    const adminPassword = process.env.ADMIN_PASSWORD || 'padraofifa';
    const hash = bcrypt.hashSync(adminPassword, 10);

    console.log(`👤 Criando admin: ${adminUsername}`);
    await client.query(
      `INSERT INTO users (name, username, password_hash, role, status)
       VALUES ($1,$2,$3,'admin','active')`,
      ['Administrador', adminUsername, hash]
    );

    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log(`   Admin: ${adminUsername}`);
    console.log(`   Senha: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
