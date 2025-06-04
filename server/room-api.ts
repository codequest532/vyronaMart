// Simplified room creation API that works with existing database
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

export async function createRoom(name: string, description: string, userId: number = 1) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Create room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Insert group directly into database
    const groupResult = await pool.query(`
      INSERT INTO shopping_groups (name, description, creator_id, is_active, max_members, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [name, description, userId, true, 10]);
    
    const dbGroup = groupResult.rows[0];
    
    // Add creator as member
    await pool.query(`
      INSERT INTO group_members (group_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
    `, [dbGroup.id, userId, 'creator']);
    
    // Format response to match expected interface
    const group = {
      id: dbGroup.id,
      name: dbGroup.name,
      description: dbGroup.description,
      category: "general",
      privacy: "public", 
      creatorId: dbGroup.creator_id,
      isActive: dbGroup.is_active,
      memberCount: 1,
      totalCart: 0,
      currentGame: null,
      roomCode: roomCode,
      scheduledTime: null,
      maxMembers: dbGroup.max_members,
      createdAt: dbGroup.created_at
    };
    
    await pool.end();
    return group;
  } catch (error) {
    await pool.end();
    throw error;
  }
}

export async function getAllRooms() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const result = await pool.query(`
      SELECT sg.*, COUNT(gm.id) as member_count
      FROM shopping_groups sg
      LEFT JOIN group_members gm ON sg.id = gm.group_id
      WHERE sg.is_active = true
      GROUP BY sg.id
      ORDER BY sg.created_at DESC
    `);
    
    const rooms = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: "general",
      privacy: "public",
      creatorId: row.creator_id,
      isActive: row.is_active,
      memberCount: parseInt(row.member_count) || 0,
      totalCart: 0,
      currentGame: null,
      roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(), // Generate for existing rooms
      scheduledTime: null,
      maxMembers: row.max_members,
      createdAt: row.created_at
    }));
    
    await pool.end();
    return rooms;
  } catch (error) {
    await pool.end();
    throw error;
  }
}