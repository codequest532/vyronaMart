// Complete VyronaSocial API - Isolated Implementation
import express from 'express';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

export function setupVyronaSocialAPI(app: express.Application) {
  // Create Shopping Room
  app.post("/api/vyronasocial/rooms", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Room name is required" });
      }

      // Generate unique room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Insert room into database
      const result = await pool.query(`
        INSERT INTO shopping_groups (name, description, creator_id, is_active, max_members, room_code, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [name, description || '', 1, true, 10, roomCode]);
      
      const dbRoom = result.rows[0];
      
      // Add creator as member
      await pool.query(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
      `, [dbRoom.id, 1, 'creator']);
      
      const room = {
        id: dbRoom.id,
        name: dbRoom.name,
        description: dbRoom.description,
        category: "general",
        privacy: "public",
        creatorId: dbRoom.creator_id,
        isActive: dbRoom.is_active,
        memberCount: 1,
        totalCart: 0,
        currentGame: null,
        roomCode: dbRoom.room_code,
        scheduledTime: null,
        maxMembers: dbRoom.max_members,
        createdAt: dbRoom.created_at
      };
      
      res.json(room);
    } catch (error) {
      console.error("VyronaSocial room creation error:", error);
      res.status(500).json({ error: "Failed to create room" });
    } finally {
      await pool.end();
    }
  });

  // Get All Rooms
  app.get("/api/vyronasocial/rooms", async (req, res) => {
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
        roomCode: row.room_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
        scheduledTime: null,
        maxMembers: row.max_members,
        createdAt: row.created_at
      }));
      
      res.json(rooms);
    } catch (error) {
      console.error("Get VyronaSocial rooms error:", error);
      res.status(500).json({ error: "Failed to get rooms" });
    } finally {
      await pool.end();
    }
  });

  // Join Room
  app.post("/api/vyronasocial/rooms/join", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const { roomCode } = req.body;
      
      if (!roomCode) {
        return res.status(400).json({ error: "Room code is required" });
      }

      // Find room by code
      const roomResult = await pool.query(`
        SELECT * FROM shopping_groups WHERE room_code = $1 AND is_active = true
      `, [roomCode]);
      
      if (roomResult.rows.length === 0) {
        return res.status(404).json({ error: "Room not found" });
      }
      
      const room = roomResult.rows[0];
      
      // Check if user already in room
      const memberCheck = await pool.query(`
        SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [room.id, 1]);
      
      if (memberCheck.rows.length > 0) {
        return res.status(400).json({ error: "Already in room" });
      }
      
      // Add member
      await pool.query(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
      `, [room.id, 1, 'member']);
      
      res.json({ message: "Joined room successfully", roomId: room.id });
    } catch (error) {
      console.error("Join room error:", error);
      res.status(500).json({ error: "Failed to join room" });
    } finally {
      await pool.end();
    }
  });

  // Delete Room (Admin Only)
  app.delete("/api/vyronasocial/rooms/:id", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const roomId = parseInt(req.params.id);
      const userId = 1; // From session when auth is implemented
      
      // Check if user is the creator/admin of the room
      const roomResult = await pool.query(`
        SELECT * FROM shopping_groups WHERE id = $1 AND creator_id = $2
      `, [roomId, userId]);
      
      if (roomResult.rows.length === 0) {
        return res.status(403).json({ error: "Only room admin can delete the room" });
      }
      
      // Delete the room (CASCADE will remove members and messages)
      await pool.query(`
        DELETE FROM shopping_groups WHERE id = $1
      `, [roomId]);
      
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Delete room error:", error);
      res.status(500).json({ error: "Failed to delete room" });
    } finally {
      await pool.end();
    }
  });

  // Exit Room
  app.post("/api/vyronasocial/rooms/:id/exit", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const roomId = parseInt(req.params.id);
      const userId = 1; // From session when auth is implemented
      
      // Check if user is in the room
      const memberResult = await pool.query(`
        SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (memberResult.rows.length === 0) {
        return res.status(400).json({ error: "You are not a member of this room" });
      }
      
      // Check if user is the creator
      const roomResult = await pool.query(`
        SELECT creator_id FROM shopping_groups WHERE id = $1
      `, [roomId]);
      
      if (roomResult.rows[0]?.creator_id === userId) {
        return res.status(400).json({ error: "Room admin cannot exit. Please delete the room instead." });
      }
      
      // Remove user from room
      await pool.query(`
        DELETE FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      res.json({ message: "Exited room successfully" });
    } catch (error) {
      console.error("Exit room error:", error);
      res.status(500).json({ error: "Failed to exit room" });
    } finally {
      await pool.end();
    }
  });
}