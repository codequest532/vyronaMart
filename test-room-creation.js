// Direct database test for room creation
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function testRoomCreation() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Testing direct database insertion...');
    
    // Test 1: Insert into shopping_groups
    const insertResult = await pool.query(`
      INSERT INTO shopping_groups (name, description, creator_id, is_active, max_members, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, ['Test Room Direct', 'Direct database test', 1, true, 10]);
    
    console.log('Room created:', insertResult.rows[0]);
    
    // Test 2: Insert group member
    const memberResult = await pool.query(`
      INSERT INTO group_members (group_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [insertResult.rows[0].id, 1, 'creator']);
    
    console.log('Member added:', memberResult.rows[0]);
    console.log('SUCCESS: Room creation works directly');
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testRoomCreation();