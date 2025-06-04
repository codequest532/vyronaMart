// Simple working room creation API
import express from 'express';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

export function setupRoomRoutes(app: express.Application) {
  // Create Shopping Room - Working Implementation
  app.post("/api/social/rooms/create", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Room name is required" });
      }

      // Insert room into database
      const result = await pool.query(`
        INSERT INTO shopping_groups (name, description, creator_id, is_active, max_members, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `, [name, description || '', 1, true, 10]);
      
      const dbRoom = result.rows[0];
      
      // Add creator as member
      await pool.query(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
      `, [dbRoom.id, 1, 'creator']);
      
      // Generate room code for joining
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const room = {
        id: dbRoom.id,
        name: dbRoom.name,
        description: dbRoom.description,
        creatorId: dbRoom.creator_id,
        isActive: dbRoom.is_active,
        memberCount: 1,
        maxMembers: dbRoom.max_members,
        roomCode: roomCode,
        createdAt: dbRoom.created_at
      };
      
      res.json(room);
    } catch (error) {
      console.error("Room creation error:", error);
      res.status(500).json({ error: "Failed to create room" });
    } finally {
      await pool.end();
    }
  });

  // Get All Rooms
  app.get("/api/social/rooms", async (req, res) => {
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
        creatorId: row.creator_id,
        isActive: row.is_active,
        memberCount: parseInt(row.member_count) || 0,
        maxMembers: row.max_members,
        createdAt: row.created_at
      }));
      
      res.json(rooms);
    } catch (error) {
      console.error("Get rooms error:", error);
      res.status(500).json({ error: "Failed to get rooms" });
    } finally {
      await pool.end();
    }
  });
}